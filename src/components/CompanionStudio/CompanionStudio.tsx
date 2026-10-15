import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  Volume2,
  Trash2,
  Plus,
  Check,
  Shield,
  Layers,
  Sliders,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { CompanionProfile, MemoryItem, PersonalityType } from '../../types/index.ts';
import { ThreeCompanion } from '../ThreeCompanion/ThreeCompanion.tsx';

interface CompanionStudioProps {
  profile: CompanionProfile;
  onUpdateProfile: (updated: CompanionProfile) => void;
  onTestVoice: (text: string, voice: string, rate: number, pitch: number) => void;
}

export const CompanionStudio: React.FC<CompanionStudioProps> = ({
  profile,
  onUpdateProfile,
  onTestVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'memory' | 'voice'>('persona');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryVal, setNewMemoryVal] = useState('');
  const [newMemoryCat, setNewMemoryCat] = useState<'preference' | 'personal' | 'project' | 'general'>('preference');
  const [customPrompt, setCustomPrompt] = useState(profile.customPrompt || '');

  const personalities: Array<{ id: PersonalityType; label: string; desc: string }> = [
    { id: 'friendly', label: 'Friendly Companion', desc: 'Warm, supportive, emotionally intelligent, conversational.' },
    { id: 'professional', label: 'Executive Advisor', desc: 'Authoritative, concise, structured, strategic.' },
    { id: 'coding_expert', label: 'Coding Architect', desc: 'Deep systems engineering, idiomatic code, bug diagnosis.' },
    { id: 'tutor', label: 'Socratic Tutor', desc: 'Pedagogical, breaks concepts down, guiding questions.' },
    { id: 'creative', label: 'Visionary Creative', desc: 'Evocative storytelling, metaphor, divergent thinking.' },
    { id: 'anime_companion', label: 'Anime Navigator', desc: 'Spirited, cheerful cyber companion with high energy.' },
    { id: 'custom', label: 'Custom System Persona', desc: 'Fully customized instruction prompt defined by you.' },
  ];

  const avatarStyles: Array<{ id: CompanionProfile['avatarStyle']; label: string }> = [
    { id: 'nova_core', label: 'Indigo Nova Core' },
    { id: 'aurora_cyber', label: 'Cyan Aurora Cyber' },
    { id: 'starlight_orb', label: 'Amber Starlight' },
    { id: 'sage_holo', label: 'Violet Hologram' },
  ];

  const voices: Array<{ id: CompanionProfile['voice']; gender: string }> = [
    { id: 'Zephyr', gender: 'Calm & balanced' },
    { id: 'Kore', gender: 'Warm & articulate' },
    { id: 'Puck', gender: 'Energetic & bright' },
    { id: 'Fenrir', gender: 'Deep & authoritative' },
    { id: 'Charon', gender: 'Resonant & measured' },
  ];

  const handleAddMemory = () => {
    if (!newMemoryKey.trim() || !newMemoryVal.trim()) return;
    const newItem: MemoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key: newMemoryKey.trim(),
      content: newMemoryVal.trim(),
      category: newMemoryCat,
      createdAt: new Date().toISOString().split('T')[0],
      enabled: true,
    };
    onUpdateProfile({
      ...profile,
      memories: [newItem, ...(profile.memories || [])],
    });
    setNewMemoryKey('');
    setNewMemoryVal('');
  };

  const handleToggleMemory = (id: string) => {
    onUpdateProfile({
      ...profile,
      memories: profile.memories.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    });
  };

  const handleDeleteMemory = (id: string) => {
    onUpdateProfile({
      ...profile,
      memories: profile.memories.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-slate-200 overflow-y-auto">
      {/* Studio Header */}
      <div className="p-4 sm:p-6 bg-[#111827] border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm tracking-wider uppercase mb-1">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Companion Personality & Memory Studio</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {profile.name} — Interactive Companion
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Customize appearance, cognitive style, conversational tone, memory banks, and vocal timbre.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('persona')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'persona'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Persona & 3D</span>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'memory'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Memory Bank ({profile.memories?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'voice'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice & Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Tab 1: Persona & 3D Avatar */}
        {activeTab === 'persona' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: 3D Companion Stage Preview */}
            <div className="md:col-span-1 p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="w-full h-56 relative rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800/80">
                <ThreeCompanion state="idle" avatarStyle={profile.avatarStyle} />
              </div>
              <h3 className="text-base font-bold text-white mt-3">{profile.name}</h3>
              <p className="text-xs text-indigo-400 font-medium capitalize mt-0.5">
                {profile.personality.replace('_', ' ')} • {profile.tone}
              </p>
              <div className="mt-3 text-[11px] text-slate-500 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-start space-x-2 text-left">
                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Companion states and 3D animations are synthetic digital visual cues, designed for intuitive engagement.</span>
              </div>
            </div>

            {/* Right: Configuration Form */}
            <div className="md:col-span-2 space-y-5">
              {/* Name & Style */}
              <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Identity & Visual Finish</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Companion Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">3D Avatar Material Theme</label>
                    <select
                      value={profile.avatarStyle}
                      onChange={(e) => onUpdateProfile({ ...profile, avatarStyle: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {avatarStyles.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversational Tone */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Conversational Tone</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['warm', 'concise', 'analytical', 'enthusiastic', 'playful'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => onUpdateProfile({ ...profile, tone: t })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                          profile.tone === t
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personality Modes */}
              <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Cognitive Personality Mode</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {personalities.map((p) => {
                    const isSelected = profile.personality === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onUpdateProfile({ ...profile, personality: p.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{p.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {profile.personality === 'custom' && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Custom System Instructions
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value);
                        onUpdateProfile({ ...profile, customPrompt: e.target.value });
                      }}
                      placeholder="Specify your custom companion personality, constraints, and instructions..."
                      rows={4}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Memory Bank */}
        {activeTab === 'memory' && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Long-Term Companion Memory
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    NOVA remembers project context, personal preferences, and directives across chats.
                  </p>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-xs text-slate-300">Enable Memories</span>
                  <input
                    type="checkbox"
                    checked={profile.memoryEnabled}
                    onChange={(e) => onUpdateProfile({ ...profile, memoryEnabled: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Add Memory Form */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-indigo-400">Add New Memory Entry</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                    placeholder="Memory Key (e.g. coding_style)"
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={newMemoryCat}
                    onChange={(e) => setNewMemoryCat(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="preference">Preference</option>
                    <option value="project">Project Context</option>
                    <option value="personal">Personal Fact</option>
                    <option value="general">General Guideline</option>
                  </select>
                  <button
                    onClick={handleAddMemory}
                    disabled={!newMemoryKey.trim() || !newMemoryVal.trim()}
                    className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save to Memory</span>
                  </button>
                </div>
                <textarea
                  value={newMemoryVal}
                  onChange={(e) => setNewMemoryVal(e.target.value)}
                  placeholder="Detail (e.g. Always write code with TypeScript strict mode, functional components, and no semicolons)..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Memory List */}
              <div className="space-y-2.5">
                {profile.memories && profile.memories.length > 0 ? (
                  profile.memories.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                        m.enabled
                          ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                          : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="space-y-1 flex-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-indigo-300">{m.key}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 uppercase font-mono">
                            {m.category}
                          </span>
                          <span className="text-[10px] text-slate-600">{m.createdAt}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{m.content}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleToggleMemory(m.id)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            m.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.enabled ? 'Active' : 'Muted'}
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No memories saved yet. Add a preference above to give NOVA persistent context!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Voice & Audio */}
        {activeTab === 'voice' && (
          <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Vocal Synthesis & Speech Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your companion's voice persona and fine-tune pitch, pace, and playback.
              </p>
            </div>

            {/* Voice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {voices.map((v) => {
                const isSelected = profile.voice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onUpdateProfile({ ...profile, voice: v.id })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-200">{v.id}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400">{v.gender}</span>
                  </button>
                );
              })}
            </div>

            {/* Sliders: Rate & Pitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Speech Rate</span>
                  <span className="font-mono text-indigo-400">{profile.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={profile.speechRate}
                  onChange={(e) => onUpdateProfile({ ...profile, speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Voice Pitch</span>
                  <span className="font-mono text-indigo-400">{profile.pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={profile.pitch}
                  onChange={(e) => onUpdateProfile({ ...profile, pitch: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Test Voice Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">Preview speaking synthesis:</span>
              <button
                onClick={() =>
                  onTestVoice(
                    `Hello! I am ${profile.name}, your intelligent AI companion. My voice is tuned and ready.`,
                    profile.voice,
                    profile.speechRate,
                    profile.pitch
                  )
                }
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Voice Sample</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
