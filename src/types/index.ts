export type PersonalityType =
  | 'friendly'
  | 'professional'
  | 'tutor'
  | 'creative'
  | 'coding_expert'
  | 'anime_companion'
  | 'custom';

export type CompanionState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'generating';

export interface MemoryItem {
  id: string;
  key: string;
  content: string;
  category: 'preference' | 'personal' | 'project' | 'general';
  createdAt: string;
  enabled: boolean;
}

export interface CompanionProfile {
  name: string;
  avatarStyle: 'nova_core' | 'aurora_cyber' | 'starlight_orb' | 'sage_holo';
  personality: PersonalityType;
  customPrompt?: string;
  tone: 'warm' | 'concise' | 'analytical' | 'enthusiastic' | 'playful';
  voice: 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon';
  speechRate: number;
  pitch: number;
  memoryEnabled: boolean;
  memories: MemoryItem[];
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  base64Data?: string;
  textPreview?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  files?: AttachedFile[];
  feedback?: 'like' | 'dislike';
  isStreaming?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  personality: PersonalityType;
}

export interface CodeProject {
  id: string;
  title: string;
  language: 'html' | 'javascript' | 'python' | 'typescript' | 'json';
  code: string;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber';
  fontSize: 'sm' | 'md' | 'lg';
  uiDensity: 'compact' | 'comfortable';
  autoVoicePlayback: boolean;
  continuousVoice: boolean;
  preferredModel: string;
  apiKeyConfigured?: boolean;
}
