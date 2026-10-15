import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileCode,
  FileText,
  Image as ImageIcon,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import type { AttachedFile, PersonalityType } from '../../types/index.ts';
import { formatBytes } from '../../utils/rules.ts';

interface ChatInputProps {
  onSendMessage: (text: string, files: AttachedFile[]) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  activePersonality: PersonalityType;
  onChangePersonality: (personality: PersonalityType) => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  isVoiceListening: boolean;
  onToggleVoice: () => void;
  voiceTranscript?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  activePersonality,
  onChangePersonality,
  selectedModel,
  onChangeModel,
  isVoiceListening,
  onToggleVoice,
  voiceTranscript,
}) => {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync voice transcript if provided
  useEffect(() => {
    if (voiceTranscript) {
      setText((prev) => (prev ? `${prev} ${voiceTranscript}` : voiceTranscript));
    }
  }, [voiceTranscript]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && attachedFiles.length === 0) || isStreaming) return;
    onSendMessage(text.trim(), attachedFiles);
    setText('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AttachedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Max 15MB per file
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 15MB limit.`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const isImg = file.type.startsWith('image/');

      if (isImg) {
        const base64 = await readFileAsDataUrl(file);
        newAttachments.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          base64Data: base64,
        });
      } else {
        // Document / code / text files
        const textContent = await readFileAsText(file);
        newAttachments.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          textPreview: textContent.slice(0, 50000), // First 50k chars
        });
      }
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className="absolute inset-x-4 inset-y-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-indigo-950/90 border-2 border-dashed border-indigo-400 text-indigo-200 backdrop-blur-sm"
        >
          <Paperclip className="w-8 h-8 mb-2 animate-bounce" />
          <span className="font-semibold text-sm">Drop documents or images here</span>
          <span className="text-xs text-indigo-300/80">Support for PDF, Code, Images, CSV, JSON</span>
        </div>
      )}

      {/* Model & Personality Controls Pill */}
      <div className="flex items-center justify-between px-2 mb-2 text-xs">
        <div className="flex items-center space-x-2">
          {/* Personality Selector */}
          <div className="relative">
            <select
              value={activePersonality}
              onChange={(e) => onChangePersonality(e.target.value as PersonalityType)}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Select companion personality"
            >
              <option value="friendly">✨ Friendly Companion</option>
              <option value="professional">💼 Professional Advisor</option>
              <option value="coding_expert">⚡ Coding Expert</option>
              <option value="tutor">🎓 Socratic Tutor</option>
              <option value="creative">🎨 Creative Writer</option>
              <option value="anime_companion">🌸 Anime Navigator</option>
              <option value="custom">⚙️ Custom Persona</option>
            </select>
          </div>

          {/* Model Selector */}
          <div className="relative hidden sm:block">
            <select
              value={selectedModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-xs font-mono font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Select AI model"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Standard)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            </select>
          </div>
        </div>

        {/* Voice Mode Status Indicator */}
        {isVoiceListening && (
          <div className="flex items-center space-x-1.5 text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Listening to speech...</span>
          </div>
        )}
      </div>

      {/* Main Composer Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        className={`relative flex flex-col rounded-2xl bg-gradient-to-b from-[#161f32] to-[#0f172a] border transition-all duration-200 shadow-xl ${
          isDragging
            ? 'border-indigo-400 ring-2 ring-indigo-500/30'
            : 'border-slate-700/80 hover:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
        }`}
      >
        {/* Attached Files Carousel */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0 border-b border-slate-800/80">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="group relative flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 shadow"
              >
                {file.type.startsWith('image/') && file.base64Data ? (
                  <img
                    src={file.base64Data}
                    alt={file.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                ) : file.name.match(/\.(ts|tsx|js|py|html|css|json)$/i) ? (
                  <FileCode className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400" />
                )}
                <div className="max-w-[120px] truncate">
                  <span className="truncate block font-medium">{file.name}</span>
                  <span className="text-[10px] text-slate-500">{formatBytes(file.size)}</span>
                </div>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Remove file"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area & Action Buttons */}
        <div className="flex items-end p-2.5 sm:p-3">
          {/* File Upload Trigger */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            title="Attach images, documents, CSV, or code files"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isVoiceListening
                ? 'Listening to speech... (speak clearly)'
                : `Message ${activePersonality === 'coding_expert' ? 'Coding Expert' : 'NOVA'}... (Shift+Enter for newline)`
            }
            rows={1}
            className="flex-1 max-h-[180px] min-h-[44px] px-3 py-2 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base focus:outline-none resize-none leading-relaxed font-sans"
          />

          {/* Voice Mode Toggle Button */}
          <button
            onClick={onToggleVoice}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              isVoiceListening
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 ring-2 ring-rose-500/40 animate-pulse'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isVoiceListening ? 'Stop voice recording' : 'Start Voice Mode (Speech-to-Text)'}
            aria-label={isVoiceListening ? 'Stop voice recording' : 'Start Voice Mode'}
          >
            {isVoiceListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send / Stop Button */}
          {isStreaming ? (
            <button
              onClick={onStopGeneration}
              className="p-2.5 ml-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/30 shrink-0"
              title="Stop generation"
              aria-label="Stop generation"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() && attachedFiles.length === 0}
              className={`p-2.5 ml-1.5 rounded-xl transition-all shadow-md shrink-0 ${
                text.trim() || attachedFiles.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
