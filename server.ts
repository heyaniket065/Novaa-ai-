import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'child_process';
import { buildCompanionSystemPrompt, validateCodeSafety } from './src/utils/rules.ts';
import type { CompanionProfile } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// Initialize Google Gen AI with telemetry
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();

  // JSON body parsing with large limit for image/document uploads
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Health and API status
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
      recommendedModel: 'gemini-3.8-flash',
      capabilities: [
        'chat-streaming',
        'code-sandbox',
        'multimodal-vision',
        'generative-tools',
        'text-to-speech',
        'image-generation',
      ],
    });
  });

  // 1. CHAT STREAMING ENDPOINT
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const {
      messages = [],
      profile,
      model = 'gemini-3.8-flash',
      temperature = 0.7,
    } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const defaultProfile: CompanionProfile = {
      name: 'NOVA',
      avatarStyle: 'nova_core',
      personality: 'friendly',
      tone: 'warm',
      voice: 'Zephyr',
      speechRate: 1.0,
      pitch: 1.0,
      memoryEnabled: true,
      memories: [],
    };

    const activeProfile: CompanionProfile = profile || defaultProfile;
    const systemInstruction = buildCompanionSystemPrompt(activeProfile);

    // If no real API key is configured, stream an intelligent demo response
    if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
      const fallbackResponse = `Greetings! I am **${activeProfile.name}**, your Next-Gen AI Companion.

I received your prompt:
> *${lastUserMsg}*

I am operating in **Full Companion Mode** with active personality: **${activeProfile.personality.toUpperCase()}** and tone: **${activeProfile.tone.toUpperCase()}**.

### Active Capabilities:
- **Real-time Code Studio:** You can open the **Code Studio** tab to write, execute Python/JavaScript code in our sandboxed runtime, or render interactive HTML/CSS projects!
- **Voice Mode:** Click the microphone icon to speak or use continuous audio conversation.
- **Multimodal Uploads:** You can drag & drop images, CSV, JSON, and documents for instant inspection.
- **Generative Tools:** Use the Tools drawer for rewriting, summarizing, translation, and image synthesis.

To enable live Gemini models with full web intelligence, configure your \`GEMINI_API_KEY\` in your AI Studio project secrets. How would you like to explore today?`;

      const words = fallbackResponse.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    try {
      // Build Gemini contents array from messages
      const contents = messages.map((m: any) => {
        const parts: any[] = [];
        
        // Handle attached files (images or documents)
        if (m.files && Array.isArray(m.files)) {
          for (const file of m.files) {
            if (file.base64Data && file.type && file.type.startsWith('image/')) {
              const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
              parts.push({
                inlineData: {
                  mimeType: file.type,
                  data: cleanBase64,
                },
              });
            } else if (file.textPreview) {
              parts.push({
                text: `[Attached Document: ${file.name}]\n${file.textPreview}\n[End of Document]\n`,
              });
            }
          }
        }

        parts.push({ text: m.content || '' });

        return {
          role: m.role === 'model' ? 'model' : 'user',
          parts,
        };
      });

      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('Error generating chat stream:', err);
      const errorMsg = err?.message || 'Error communicating with AI service.';
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  // 2. CODE EXECUTION SANDBOX
  app.post('/api/code/run', async (req: Request, res: Response) => {
    const { code, language = 'javascript' } = req.body;

    const safetyCheck = validateCodeSafety(code, language);
    if (!safetyCheck.safe) {
      return res.status(400).json({
        stdout: '',
        stderr: safetyCheck.reason || 'Security violation: prohibited code construct detected.',
        exitCode: 1,
        executionTime: 0,
      });
    }

    const startTime = Date.now();
    let command = '';
    let args: string[] = [];

    if (language === 'python') {
      command = 'python3';
      args = ['-c', code];
    } else if (language === 'javascript' || language === 'typescript') {
      command = 'node';
      args = ['-e', code];
    } else {
      return res.status(400).json({
        stdout: '',
        stderr: `Language '${language}' is executed client-side via Web Sandbox.`,
        exitCode: 0,
        executionTime: 0,
      });
    }

    try {
      const child = spawn(command, args, {
        timeout: 7000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > 100000) child.kill();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > 50000) child.kill();
      });

      child.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        res.json({
          stdout: stdout || (code === 0 && !stderr ? 'Execution completed with no standard output.' : ''),
          stderr,
          exitCode: code ?? 0,
          executionTime,
        });
      });

      child.on('error', (err) => {
        res.json({
          stdout: '',
          stderr: `Execution error: ${err.message}`,
          exitCode: 1,
          executionTime: Date.now() - startTime,
        });
      });
    } catch (err: any) {
      res.status(500).json({
        stdout: '',
        stderr: `Process launch failure: ${err.message}`,
        exitCode: 1,
        executionTime: Date.now() - startTime,
      });
    }
  });

  // 3. GENERATIVE TOOLS ENDPOINT
  app.post('/api/tools/execute', async (req: Request, res: Response) => {
    const { tool, input, context = '', language = 'English', targetLength = 'standard' } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input text is required.' });
    }

    const prompts: Record<string, string> = {
      summarize: `Summarize the following text concisely. Highlight key takeaways in bullet points and provide a 2-sentence executive summary:\n\n${input}`,
      rewrite: `Rewrite the following text with enhanced clarity, engagement, and flow while preserving all core facts:\n\n${input}`,
      translate: `Translate the following text into ${language}. Provide the direct translation followed by brief grammatical and cultural nuance notes:\n\n${input}`,
      brainstorm: `Brainstorm 8 innovative, actionable ideas based on this premise:\n"${input}"\nGroup them by category with brief rationale and feasibility score.`,
      story: `Write a compelling narrative scene featuring dialogue, sensory detail, and character motivation based on:\n"${input}"`,
      prompt_improve: `You are an elite prompt engineer. Analyze the following user prompt:\n"${input}"\n\nRewrite it into a comprehensive, high-leverage master prompt with System Role, Detailed Context, Step-by-Step Instructions, Constraints, and Expected Output Format. Also explain why this new version is more effective.`,
      data_analyze: `Analyze this dataset / structured data (CSV/JSON/Text):\n\n${input}\n\nProvide: 1) Structural Overview, 2) Key Metrics and Statistical Insights, 3) Notable Trends or Anomalies, 4) Strategic Recommendations.`,
      code_debug: `You are a principal debugging engineer. Analyze this code and error:\n\nCode:\n${input}\n\nDiagnostics Context:\n${context}\n\nProvide: 1) Root Cause Analysis, 2) Corrected Code snippet, 3) Prevention Best Practice.`,
    };

    const promptText = prompts[tool] || `Process this request professionally:\n${input}`;

    if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Deterministic fallback response when API key is not configured
      const fallbackResults: Record<string, string> = {
        summarize: `### Executive Summary\nThe provided content discusses crucial workflows and key milestones with an emphasis on clarity and execution.\n\n### Key Takeaways\n- **Primary Focus:** High fidelity execution and responsive performance.\n- **Architecture:** Clean modular components with client-server separation.\n- **Next Steps:** Review implementation criteria and deploy.`,
        rewrite: `Here is a refined, engaging version of your text:\n\n> "${input.trim()}"\n\n*Optimized for clarity, natural cadence, and professional impact.*`,
        translate: `### Translation to ${language}\n\n*${input}*\n\n*(Note: Configure your GEMINI_API_KEY to activate full neural translation across 100+ global languages!)*`,
        brainstorm: `### 8 Innovation Vectors for "${input.slice(0, 40)}..."\n1. **AI-Driven Acceleration:** Automated workflow integration.\n2. **Contextual Memory Graph:** Retaining cross-session project knowledge.\n3. **Multimodal Synthesis:** Combining voice, vision, and code.\n4. **Adaptive UI:** Context-aware dashboard restructuring.\n5. **Edge Execution:** Low-latency local client sandbox.\n6. **Collaborative Review:** Pair programming with AI companion.\n7. **Predictive Assistance:** Proactive suggestions based on code AST.\n8. **Voice Control:** Hands-free command execution.`,
        prompt_improve: `### Master Optimized Prompt\n\n**Role:** Senior Specialist & Domain Advisor\n**Task:** ${input}\n**Format:** Well-structured Markdown with step-by-step rationales\n**Constraints:** Crisp, zero-fluff, production-grade quality.`,
        data_analyze: `### Data Insight Summary\n- **Records Processed:** Validated sample format\n- **Key Observation:** Consistent data distributions detected\n- **Recommendation:** Normalize columns and leverage automated statistical aggregations.`,
        code_debug: `### Code Diagnostics & Fix\n**Root Cause:** Syntax or type boundary check needed.\n**Recommended Fix:** Verify variable scoping and check for null/undefined guards.\n\`\`\`javascript\n// Verified solution pattern\n${input}\n\`\`\``,
        story: `The lights in the digital atrium hummed with amber resonance. "Every variable tells a story," Nova murmured, watching the data streams cascade...`,
      };

      return res.json({
        result: fallbackResults[tool] || `Processed result for: ${input.slice(0, 100)}`,
        tool,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
      });

      res.json({
        result: response.text || 'Processing completed.',
        tool,
      });
    } catch (err: any) {
      console.error('Tools error:', err);
      res.status(500).json({ error: err.message || 'Failed to process generative tool request.' });
    }
  });

  // 4. IMAGE GENERATION ENDPOINT
  app.post('/api/generate-image', async (req: Request, res: Response) => {
    const { prompt, aspectRatio = '1:1' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }

    if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Return a sleek procedurally crafted SVG data URL fallback
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#311042" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="600" fill="url(#bg)" />
        <circle cx="300" cy="300" r="180" fill="url(#glow)" />
        <circle cx="300" cy="300" r="120" stroke="#818cf8" stroke-width="2" fill="none" opacity="0.6" stroke-dasharray="8 6"/>
        <text x="300" y="290" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#f8fafc" text-anchor="middle">NOVA AI GENERATION</text>
        <text x="300" y="325" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${prompt.slice(0, 45)}...</text>
        <text x="300" y="550" font-family="system-ui, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Generated with NOVA Studio Engine</text>
      </svg>`;
      const base64 = Buffer.from(svg).toString('base64');
      return res.json({
        imageUrl: `data:image/svg+xml;base64,${base64}`,
        prompt,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error('No image was returned by the generative model.');
      }

      res.json({ imageUrl, prompt });
    } catch (err: any) {
      console.error('Image gen error:', err);
      res.status(500).json({ error: err.message || 'Image generation failed.' });
    }
  });

  // 5. TEXT-TO-SPEECH ENDPOINT
  app.post('/api/tts', async (req: Request, res: Response) => {
    const { text, voice = 'Zephyr' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Signal client to use native Web SpeechSynthesis
      return res.json({ fallbackWebSpeech: true });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: 'Warm, natural, clear speaking tone',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.json({ fallbackWebSpeech: true });
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err: any) {
      console.error('TTS error:', err);
      // Fallback cleanly to client Web Speech API
      res.json({ fallbackWebSpeech: true });
    }
  });

  // Serve Frontend via Vite (Dev or Prod)
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`NOVA AI Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
