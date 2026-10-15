import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit2,
  Volume2,
  VolumeX,
  FileText,
  AlertCircle,
  Sparkles,
  User,
  ArrowRight,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import type { ChatMessage, CompanionProfile } from '../../types/index.ts';
import { formatBytes } from '../../utils/rules.ts';

interface MessageItemProps {
  message: ChatMessage;
  companionProfile: CompanionProfile;
  isLastModelMessage: boolean;
  onRegenerate?: () => void;
  onEditMessage?: (id: string, newContent: string) => void;
  onContinue?: () => void;
  onOpenInCodeStudio?: (code: string, language: string) => void;
  onPlayVoice?: (text: string) => void;
  isSpeakingThis?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  companionProfile,
  isLastModelMessage,
  onRegenerate,
  onEditMessage,
  onContinue,
  onOpenInCodeStudio,
  onPlayVoice,
  isSpeakingThis = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | undefined>(message.feedback);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (onEditMessage && editContent.trim()) {
      onEditMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group relative flex gap-3.5 px-4 py-4 rounded-2xl transition-all duration-200 ${
        isUser
          ? 'bg-slate-800/40 border border-slate-700/40 ml-8 md:ml-20'
          : 'bg-[#111827]/70 border border-slate-800/80 mr-4 md:mr-16 shadow-lg shadow-black/10'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Header: Sender & Timestamp */}
        <div className="flex items-center justify-between mb-1 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">
              {isUser ? 'You' : companionProfile.name}
            </span>
            {!isUser && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {companionProfile.personality.replace('_', ' ')}
              </span>
            )}
            <span className="text-slate-500 text-[11px]">{message.timestamp}</span>
          </div>

          {/* Quick Actions (Copy, TTS, Feedback) */}
          <div className="flex items-center space-x-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {!isUser && onPlayVoice && (
              <button
                onClick={() => onPlayVoice(message.content)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSpeakingThis
                    ? 'text-indigo-400 bg-indigo-500/20 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isSpeakingThis ? 'Speaking...' : 'Listen to message'}
                aria-label="Listen to message"
              >
                {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Copy message"
              aria-label="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {isUser && onEditMessage && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Edit message"
                aria-label="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && (
              <>
                <button
                  onClick={() => setFeedback(feedback === 'like' ? undefined : 'like')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    feedback === 'like'
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Helpful"
                  aria-label="Thumbs up"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'dislike' ? undefined : 'dislike')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    feedback === 'dislike'
                      ? 'text-rose-400 bg-rose-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Unhelpful"
                  aria-label="Thumbs down"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Attached Files Preview */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 my-2">
            {message.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300"
              >
                {file.type.startsWith('image/') && file.base64Data ? (
                  <img
                    src={file.base64Data}
                    alt={file.name}
                    className="w-7 h-7 object-cover rounded shadow"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400" />
                )}
                <div className="max-w-[140px] truncate">
                  <span className="truncate block font-medium">{file.name}</span>
                  <span className="text-[10px] text-slate-500">{formatBytes(file.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content View / Edit Mode */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-900 border border-indigo-500 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-sans min-h-[80px]"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                Save & Resubmit
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <MarkdownRenderer
              content={message.content}
              onOpenInCodeStudio={onOpenInCodeStudio}
            />

            {/* Streaming Cursor */}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
            )}

            {/* Error Banner */}
            {message.error && (
              <div className="mt-2 flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to complete generation. Click regenerate to retry.</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions for Model response (Regenerate, Continue) */}
        {!isUser && isLastModelMessage && !message.isStreaming && (
          <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-slate-800/60 text-xs">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Regenerate response</span>
              </button>
            )}

            {onContinue && (
              <button
                onClick={onContinue}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Continue response</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
