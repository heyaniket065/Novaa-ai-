import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Languages,
  Lightbulb,
  BookOpen,
  Image as ImageIcon,
  Table2,
  Wand2,
  Copy,
  Check,
  Download,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { MarkdownRenderer } from '../Chat/MarkdownRenderer.tsx';

type ToolCategory =
  | 'writing'
  | 'summarize'
  | 'translate'
  | 'brainstorm'
  | 'story'
  | 'image_gen'
  | 'data_analyze'
  | 'prompt_improve';

interface ToolDef {
  id: ToolCategory;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  sampleInput: string;
}

const TOOLS: ToolDef[] = [
  {
    id: 'writing',
    name: 'Content & Copywriting',
    description: 'Generate high-impact essays, technical articles, and persuasive copy.',
    icon: FileText,
    placeholder: 'Describe the topic, target audience, and key arguments...',
    sampleInput: 'Write a comprehensive guide on building scalable event-driven architectures with TypeScript and microservices.',
  },
  {
    id: 'summarize',
    name: 'Executive Summarizer',
    description: 'Distill lengthy reports, meeting transcripts, and articles into sharp takeaways.',
    icon: Wand2,
    placeholder: 'Paste the article, report, or transcript to summarize...',
    sampleInput: 'Artificial intelligence is accelerating rapid shifts across software engineering. Recent benchmarks indicate modern models can reason over multimodal inputs, formulate test-driven hypotheses, and inspect codebases directly. Organizations embracing AI-assisted development report marked gains in velocity while requiring enhanced automated sandboxing and guardrails.',
  },
  {
    id: 'translate',
    name: 'Neural Translator & Nuance',
    description: 'Translate across global languages with cultural context and grammatical notes.',
    icon: Languages,
    placeholder: 'Enter text to translate with linguistic commentary...',
    sampleInput: 'Innovation thrives when curiosity is paired with relentless discipline and thoughtful architecture.',
  },
  {
    id: 'brainstorm',
    name: 'Idea & Strategy Engine',
    description: 'Divergent brainstorming, product concepts, and growth vectors.',
    icon: Lightbulb,
    placeholder: 'Enter a problem statement, domain, or product goal...',
    sampleInput: 'Novel applications combining local voice AI companions with 3D spatial interfaces for productivity.',
  },
  {
    id: 'image_gen',
    name: 'AI Image Studio',
    description: 'Synthesize visual artwork and conceptual imagery with aspect ratio controls.',
    icon: ImageIcon,
    placeholder: 'Describe the visual scene in vivid detail (style, lighting, mood, camera angle)...',
    sampleInput: 'Futuristic AI companion robot floating in a sleek glass observatory overlooking a neon cyberpunk metropolis, cinematic lighting, 8k render.',
  },
  {
    id: 'data_analyze',
    name: 'Data & CSV Inspector',
    description: 'Analyze CSV or JSON datasets for anomalies, distributions, and actionable insights.',
    icon: Table2,
    placeholder: 'Paste CSV or JSON dataset here...',
    sampleInput: `date,product,sales,satisfaction
2026-01-01,AI Studio Pro,1250,94%
2026-01-02,Companion Mesh,820,91%
2026-01-03,Vision Lens,1540,98%
2026-01-04,Neural Audio,980,88%`,
  },
  {
    id: 'prompt_improve',
    name: 'Prompt Optimizer',
    description: 'Transform informal instructions into high-leverage production master prompts.',
    icon: Sparkles,
    placeholder: 'Enter the draft prompt you want to optimize...',
    sampleInput: 'Help me write better clean code in React.',
  },
  {
    id: 'story',
    name: 'Story & Dialogue Studio',
    description: 'Craft rich character arcs, screenplays, and dialogue sequences.',
    icon: BookOpen,
    placeholder: 'Describe characters, setting, and emotional conflict...',
    sampleInput: 'A veteran systems architect and a newly awakened synthetic companion collaborating during a global server blackout.',
  },
];

export const GenerativeTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolCategory>('writing');
  const [inputText, setInputText] = useState<string>(TOOLS[0].sampleInput);
  const [targetLanguage, setTargetLanguage] = useState<string>('Japanese');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const activeToolDef = TOOLS.find((t) => t.id === selectedTool) || TOOLS[0];

  const handleSelectTool = (tool: ToolCategory) => {
    setSelectedTool(tool);
    const def = TOOLS.find((t) => t.id === tool);
    if (def) {
      setInputText(def.sampleInput);
      setResultText('');
      setGeneratedImageUrl('');
    }
  };

  const handleExecute = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResultText('');
    setGeneratedImageUrl('');

    if (selectedTool === 'image_gen') {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: inputText.trim(), aspectRatio }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
        } else {
          setResultText(data.error || 'Image generation failed.');
        }
      } catch (err: any) {
        setResultText(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          input: inputText.trim(),
          language: targetLanguage,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setResultText(data.result);
      } else {
        setResultText(data.error || 'Generation failed.');
      }
    } catch (err: any) {
      setResultText(`Execution error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-[#111827] border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Generative AI Studio Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Universal Intelligence & Creative Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Select a specialized generative engine to craft content, synthesize media, optimize prompts, or inspect structured data.
          </p>

          {/* Tools Grid Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  } border`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium truncate">{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Active Tool Config & Input */}
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{activeToolDef.name}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{activeToolDef.description}</p>
            </div>

            {/* Language Selector for Translation */}
            {selectedTool === 'translate' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Target Language:</span>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Japanese">Japanese</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese (Mandarin)">Chinese (Mandarin)</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Korean">Korean</option>
                </select>
              </div>
            )}

            {/* Aspect Ratio for Image Gen */}
            {selectedTool === 'image_gen' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Aspect Ratio:</span>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Vertical</option>
                </select>
              </div>
            )}
          </div>

          {/* Input Box */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={activeToolDef.placeholder}
            rows={5}
            className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
          />

          {/* Run Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setInputText(activeToolDef.sampleInput)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Load Sample Template
            </button>

            <button
              onClick={handleExecute}
              disabled={isLoading || !inputText.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with NOVA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Output</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {(resultText || generatedImageUrl) && (
          <div className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Generated Output
              </span>
              <div className="flex items-center space-x-2">
                {resultText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
                {generatedImageUrl && (
                  <a
                    href={generatedImageUrl}
                    download="nova-generated.png"
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </a>
                )}
              </div>
            </div>

            {/* Generated Image Preview */}
            {generatedImageUrl && (
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <img
                  src={generatedImageUrl}
                  alt="Generated by NOVA Studio"
                  className="max-h-[460px] w-auto rounded-lg shadow-2xl object-contain border border-slate-700/60"
                />
              </div>
            )}

            {/* Generated Text / Markdown */}
            {resultText && (
              <div className="p-2">
                <MarkdownRenderer content={resultText} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
