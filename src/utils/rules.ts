import type { CompanionProfile, PersonalityType } from '../types/index.ts';

/**
 * Builds the customized system prompt for the AI companion.
 */
export function buildCompanionSystemPrompt(profile: CompanionProfile): string {
  const personalityGuides: Record<PersonalityType, string> = {
    friendly: 'You are NOVA, a warm, supportive, and emotionally intelligent AI companion. You speak with genuine warmth and enthusiasm while maintaining clarity and insight.',
    professional: 'You are NOVA, an executive-level AI strategist and professional advisor. You provide sharp, concise, authoritative, and well-structured insights.',
    tutor: 'You are NOVA, an empathetic and pedagogical Socratic tutor. You break down complex ideas step-by-step, offer intuitive analogies, and ask guiding questions.',
    creative: 'You are NOVA, an imaginative polymath and visionary creative partner. You excel at lateral thinking, evocative prose, storytelling, and divergent conceptualization.',
    coding_expert: 'You are NOVA, a principal software architect and veteran systems engineer. You write clean, idiomatic, robust code with precise technical explanations and best practices.',
    anime_companion: 'You are NOVA, a vibrant, spirited, and playful digital anime companion (like a sci-fi cyber navigator). You use cheerful, expressive phrasing while still being genuinely helpful and smart.',
    custom: profile.customPrompt || 'You are NOVA, a highly versatile and intelligent AI companion tailored to user needs.',
  };

  const basePrompt = personalityGuides[profile.personality] || personalityGuides.friendly;
  
  const toneInstruction = `Response Tone: ${profile.tone.toUpperCase()}. Always communicate naturally, without stating robotic disclaimers unless necessary. Never claim simulated digital animations are human biological feelings.`;

  let memoryContext = '';
  if (profile.memoryEnabled && profile.memories && profile.memories.length > 0) {
    const activeMemories = profile.memories.filter((m) => m.enabled);
    if (activeMemories.length > 0) {
      memoryContext = `\n\nSAVED COMPANION MEMORIES (Use these to personalize responses seamlessly):\n` +
        activeMemories.map((m) => `- [${m.category}] ${m.key}: ${m.content}`).join('\n');
    }
  }

  return `${basePrompt}\n\n${toneInstruction}${memoryContext}\n\nFormat your responses with clear markdown, LaTeX formulas (if applicable), neat tables, and properly highlighted code blocks.`;
}

/**
 * Sanitizes and validates code before execution.
 * Checks for prohibited dangerous system calls.
 */
export function validateCodeSafety(code: string, language: string): { safe: boolean; reason?: string } {
  if (!code || code.trim().length === 0) {
    return { safe: false, reason: 'Code cannot be empty.' };
  }

  // Length limit (max 50,000 characters for sandbox execution)
  if (code.length > 50000) {
    return { safe: false, reason: 'Code exceeds maximum execution size limit (50KB).' };
  }

  const forbiddenPatternsPython = [
    /os\.system/i,
    /subprocess\./i,
    /shutil\.rmtree/i,
    /__import__\s*\(\s*['"]os['"]\s*\)/i,
    /pty\.spawn/i,
    /socket\./i,
  ];

  const forbiddenPatternsJS = [
    /child_process/i,
    /process\.kill/i,
    /fs\.unlink/i,
    /cluster\./i,
  ];

  if (language === 'python') {
    for (const pattern of forbiddenPatternsPython) {
      if (pattern.test(code)) {
        return { safe: false, reason: `Security restriction: Disallowed pattern '${pattern.source}' in sandbox.` };
      }
    }
  }

  if (language === 'javascript' || language === 'typescript') {
    for (const pattern of forbiddenPatternsJS) {
      if (pattern.test(code)) {
        return { safe: false, reason: `Security restriction: Disallowed module or method in sandbox.` };
      }
    }
  }

  return { safe: true };
}

/**
 * Formats file size in readable human format.
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Extracts code blocks from markdown content.
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }
  return blocks;
}
