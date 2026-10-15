import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
  Keyboard,
  Shield,
  Sparkles,
  Sliders,
  Volume2,
  Check,
  Cpu,
} from 'lucide-react';
import type { AppSettings, Conversation } from '../../types/index.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  conversations: Conversation[];
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  conversations,
  onClearAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'voice' | 'data' | 'shortcuts'>('general');
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `nova-ai-chats-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const handleExportMarkdown = () => {
    let md = `# NOVA AI Studio — Exported Chat Archive\nExport Date: ${new Date().toISOString()}\n\n`;
    conversations.forEach((conv) => {
      md += `## Conversation: ${conv.title}\nDate: ${conv.createdAt}\nPersonality: ${conv.personality}\n\n`;
      conv.messages.forEach((msg) => {
        md += `### ${msg.role === 'user' ? 'User' : 'NOVA'} (${msg.timestamp}):\n${msg.content}\n\n`;
      });
      md += `---\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `nova-ai-chats-${new Date().toISOString().split('T')[0]}.md`);
    dl.click();
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131d33]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 id="settings-title" className="text-base font-bold text-white">App Settings & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50 text-xs overflow-x-auto">
          {[
            { id: 'general', label: 'General & Model' },
            { id: 'appearance', label: 'Appearance & UI' },
            { id: 'voice', label: 'Voice & Audio' },
            { id: 'data', label: 'Data & Privacy' },
            { id: 'shortcuts', label: 'Shortcuts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* General & Model */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Default AI Engine Model
                </label>
                <select
                  value={settings.preferredModel}
                  onChange={(e) => onUpdateSettings({ ...settings, preferredModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, Balanced Speed & Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Low Latency)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Powered by the Google GenAI SDK. API keys are securely managed server-side.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Connection & Runtime Status</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">Server Status: <span className="text-emerald-400 font-semibold">Online</span></div>
                  <div className="text-slate-400">Code Sandbox: <span className="text-emerald-400 font-semibold">Ready (Node/Python)</span></div>
                  <div className="text-slate-400">Total Conversations: <span className="text-white font-semibold">{conversations.length}</span></div>
                  <div className="text-slate-400">3D WebGL Engine: <span className="text-emerald-400 font-semibold">Three.js Active</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance & UI */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'system', label: 'System Default', icon: Monitor },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onUpdateSettings({ ...settings, theme: t.id as any })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1 text-indigo-400" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Font Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Chat Font Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'sm', label: 'Compact (13px)' },
                    { id: 'md', label: 'Default (15px)' },
                    { id: 'lg', label: 'Large (17px)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateSettings({ ...settings, fontSize: s.id as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        settings.fontSize === s.id
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interface Density */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Interface Density
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'comfortable', label: 'Comfortable' },
                    { id: 'compact', label: 'Compact' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onUpdateSettings({ ...settings, uiDensity: d.id as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        settings.uiDensity === d.id
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Voice & Audio */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <div>
                  <span className="block font-medium text-slate-200 text-xs">Auto Voice Playback</span>
                  <span className="text-[11px] text-slate-400">Automatically read out new AI responses upon completion.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoVoicePlayback}
                  onChange={(e) => onUpdateSettings({ ...settings, autoVoicePlayback: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <div>
                  <span className="block font-medium text-slate-200 text-xs">Continuous Voice Mode</span>
                  <span className="text-[11px] text-slate-400">Keep listening after speaking response finishes for hands-free chat.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.continuousVoice}
                  onChange={(e) => onUpdateSettings({ ...settings, continuousVoice: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Data & Privacy */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Export Chat Archive
                </span>
                <p className="text-xs text-slate-400">
                  Download all your conversations, system instructions, and messages for backup or documentation.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export as JSON</span>
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export as Markdown</span>
                  </button>
                  {exportSuccess && <span className="text-xs text-emerald-400 font-medium">Exported!</span>}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block">
                  Danger Zone
                </span>
                <p className="text-xs text-rose-400/80">
                  Permanently clear all conversation sessions from your local browser storage.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all conversation history? This cannot be undone.')) {
                      onClearAllChats();
                      onClose();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold transition-colors mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Conversations</span>
                </button>
              </div>
            </div>
          )}

          {/* Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Keyboard Shortcuts
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { keys: ['Enter'], desc: 'Send message' },
                  { keys: ['Shift', 'Enter'], desc: 'New line in composer' },
                  { keys: ['Esc'], desc: 'Close dialogs and modals' },
                  { keys: ['Ctrl', 'K'], desc: 'Search conversation history' },
                  { keys: ['Ctrl', 'B'], desc: 'Toggle sidebar' },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-300">{s.desc}</span>
                    <div className="flex items-center space-x-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
