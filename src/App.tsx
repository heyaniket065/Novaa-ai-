/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Bot,
  Code2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar/Sidebar.tsx';
import { MessageItem } from './components/Chat/MessageItem.tsx';
import { ChatInput } from './components/Chat/ChatInput.tsx';
import { ThreeCompanion } from './components/ThreeCompanion/ThreeCompanion.tsx';
import { CodingStudio } from './components/CodingStudio/CodingStudio.tsx';
import { GenerativeTools } from './components/GenerativeTools/GenerativeTools.tsx';
import { CompanionStudio } from './components/CompanionStudio/CompanionStudio.tsx';
import { SettingsModal } from './components/Settings/SettingsModal.tsx';
import type {
  ChatMessage,
  Conversation,
  CompanionProfile,
  AppSettings,
  AttachedFile,
  PersonalityType,
  CompanionState,
} from './types/index.ts';

const DEFAULT_PROFILE: CompanionProfile = {
  name: 'NOVA',
  avatarStyle: 'nova_core',
  personality: 'friendly',
  tone: 'warm',
  voice: 'Zephyr',
  speechRate: 1.0,
  pitch: 1.0,
  memoryEnabled: true,
  memories: [
    {
      id: 'mem-1',
      key: 'architecture_preference',
      content: 'Prefers modern TypeScript, modular components, and clean functional patterns.',
      category: 'preference',
      createdAt: '2026-10-15',
      enabled: true,
    },
    {
      id: 'mem-2',
      key: 'workflow_style',
      content: 'Enjoys direct, actionable code examples with automated tests and clear explanations.',
      category: 'general',
      createdAt: '2026-10-15',
      enabled: true,
    },
  ],
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'indigo',
  fontSize: 'md',
  uiDensity: 'comfortable',
  autoVoicePlayback: false,
  continuousVoice: false,
  preferredModel: 'gemini-3.8-flash',
};

const INITIAL_CONVERSATION: Conversation = {
  id: 'conv-initial-1',
  title: 'Welcome to NOVA Studio',
  createdAt: '2026-10-15',
  updatedAt: '2026-10-15',
  personality: 'friendly',
  messages: [
    {
      id: 'msg-welcome-1',
      role: 'model',
      content: `Hello! I am **NOVA**, your Next-Gen AI Companion and Universal AI Studio partner.

I combine conversational intelligence with:
- 💡 **Multimodal Vision & Documents:** Upload images, CSVs, or code files for instant analysis.
- ⚡ **Professional Coding Studio:** Write and run live **JavaScript** and **Python 3** in a secure sandbox, or preview **HTML/CSS/JS** projects live!
- 🎙️ **Voice Mode:** Speak hands-free and hear natural vocal responses.
- 🎨 **Generative Tools Hub:** Access specialized engines for copywriting, summarization, prompt enhancement, and image generation.
- 🧠 **Persistent Long-Term Memory:** Customize my personality, cognitive style, and saved memories.

Try asking me a question, or test our **Coding Studio** by clicking the tab on the left!`,
      timestamp: '10:15 AM',
    },
  ],
};

export default function App() {
  // 1. Core State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('nova_conversations');
      return saved ? JSON.parse(saved) : [INITIAL_CONVERSATION];
    } catch {
      return [INITIAL_CONVERSATION];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || 'conv-initial-1';
  });

  const [profile, setProfile] = useState<CompanionProfile>(() => {
    try {
      const saved = localStorage.getItem('nova_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('nova_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 2. View & UI State
  const [activeView, setActiveView] = useState<'chat' | 'coding' | 'tools' | 'companion'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [show3DHero, setShow3DHero] = useState<boolean>(true);

  // 3. Companion Emotion & Speaking State
  const [companionState, setCompanionState] = useState<CompanionState>('idle');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeVoiceAudio, setActiveVoiceAudio] = useState<HTMLAudioElement | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // 4. Voice Speech-to-Text State
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const speechRecognitionRef = useRef<any>(null);

  // 5. Code Studio Bridge
  const [studioInitialCode, setStudioInitialCode] = useState<string | undefined>();
  const [studioInitialLang, setStudioInitialLang] = useState<string | undefined>();

  // AbortController for streaming cancellations
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('nova_conversations', JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem('nova_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('nova_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Current active conversation
  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // Auto-scroll chat smoothly
  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'chat') {
      scrollToBottom();
    }
  }, [currentConversation?.messages.length, isStreaming]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = settings.continuousVoice;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setCompanionState('listening');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsVoiceListening(false);
        setCompanionState('idle');
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
        if (!isStreaming) setCompanionState('idle');
      };

      speechRecognitionRef.current = recognition;
    }
  }, [settings.continuousVoice]);

  const toggleVoiceListening = () => {
    if (!speechRecognitionRef.current) {
      alert('Speech Recognition is not supported by your browser or microphone permissions were denied.');
      return;
    }

    if (isVoiceListening) {
      speechRecognitionRef.current.stop();
      setIsVoiceListening(false);
      setCompanionState('idle');
    } else {
      setVoiceTranscript('');
      try {
        speechRecognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  // Play Speech (TTS)
  const handlePlayVoice = async (text: string, messageId?: string) => {
    if (activeVoiceAudio) {
      activeVoiceAudio.pause();
      setActiveVoiceAudio(null);
      setSpeakingMessageId(null);
      setCompanionState('idle');
      return;
    }

    setCompanionState('speaking');
    if (messageId) setSpeakingMessageId(messageId);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 1000), // Clean TTS limit
          voice: profile.voice,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audio.playbackRate = profile.speechRate;
        setActiveVoiceAudio(audio);
        audio.onended = () => {
          setActiveVoiceAudio(null);
          setSpeakingMessageId(null);
          setCompanionState('idle');
          if (settings.continuousVoice && speechRecognitionRef.current) {
            try {
              speechRecognitionRef.current.start();
            } catch {}
          }
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Backend TTS failed, using Web Speech API fallback', err);
    }

    // Client-side Web Speech fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
      utterance.rate = profile.speechRate;
      utterance.pitch = profile.pitch;
      utterance.onend = () => {
        setSpeakingMessageId(null);
        setCompanionState('idle');
        if (settings.continuousVoice && speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.start();
          } catch {}
        }
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setCompanionState('idle');
      setSpeakingMessageId(null);
    }
  };

  // Send Message & Stream Response
  const handleSendMessage = async (text: string, files: AttachedFile[]) => {
    if (!text.trim() && files.length === 0) return;

    // Create User Message
    const userMsgId = `msg-user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      files: files.length > 0 ? files : undefined,
    };

    // Placeholder Model Message for streaming
    const modelMsgId = `msg-model-${Date.now()}`;
    const modelMessage: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    const updatedMessages = [...currentConversation.messages, userMessage, modelMessage];

    // Update conversation title if first message
    let updatedTitle = currentConversation.title;
    if (currentConversation.messages.length <= 1) {
      updatedTitle = text.slice(0, 30) || (files[0]?.name ? `File: ${files[0].name}` : 'New Conversation');
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setIsStreaming(true);
    setCompanionState('thinking');

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...currentConversation.messages, userMessage],
          profile,
          model: settings.preferredModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available.');

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setCompanionState('speaking');

                // Update current message state
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === activeConversationId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === modelMsgId
                              ? { ...m, content: accumulatedText, isStreaming: true }
                              : m
                          ),
                        }
                      : c
                  )
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Non-JSON SSE line, continue
            }
          }
        }
      }

      // Stream Finished Successfully
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === modelMsgId
                    ? { ...m, content: accumulatedText, isStreaming: false }
                    : m
                ),
              }
            : c
        )
      );

      // Trigger auto voice if enabled
      if (settings.autoVoicePlayback && accumulatedText) {
        handlePlayVoice(accumulatedText, modelMsgId);
      } else {
        setCompanionState('idle');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Handled stop generation
      } else {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === modelMsgId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            'I encountered an error communicating with the AI service. Please verify your connection or retry.',
                          isStreaming: false,
                          error: true,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
      setCompanionState('idle');
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setCompanionState('idle');
    }
  };

  // Chat Actions
  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      personality: profile.personality,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          content: `New session started with **${profile.name}** (${profile.personality.replace('_', ' ')}). How can I assist you right now?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setActiveView('chat');
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleDeleteChat = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      handleNewChat();
    } else {
      setConversations(remaining);
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleClearAllChats = () => {
    localStorage.removeItem('nova_conversations');
    const resetConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      personality: profile.personality,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          content: `All conversation archives cleared. Starting fresh! How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setConversations([resetConv]);
    setActiveConversationId(resetConv.id);
  };

  const handleOpenInCodeStudio = (code: string, language: string) => {
    setStudioInitialCode(code);
    setStudioInitialLang(language);
    setActiveView('coding');
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${settings.theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-[#0b0f19] text-[#e2e8f0]'}`}>
      {/* Sidebar Component */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setActiveView('chat');
        }}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        companionProfile={profile}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-[#0f172a] border-b border-slate-800 shrink-0 z-10">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-wide text-white">NOVA AI STUDIO</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Open settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </header>

        {/* View 1: Main Conversational Chat */}
        {activeView === 'chat' && (
          <div className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden">
            {/* Top 3D Companion Hero Stage (Collapsible) */}
            <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-[#111827]/90 to-[#0b0f19]/70 shrink-0 transition-all duration-300">
              {show3DHero ? (
                <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 3D WebGL Canvas */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-700/60 shadow-lg relative shrink-0">
                      <ThreeCompanion
                        state={companionState}
                        avatarStyle={profile.avatarStyle}
                      />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="font-bold text-sm sm:text-base text-white">{profile.name}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                          {companionState}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-sm line-clamp-1">
                        Mode: <strong className="text-slate-200 capitalize">{profile.personality.replace('_', ' ')}</strong> ({profile.tone} tone)
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                        <span>Voice: <strong className="text-slate-400">{profile.voice}</strong></span>
                        <span>•</span>
                        <span>Memories: <strong className="text-slate-400">{profile.memories?.filter((m) => m.enabled).length || 0} active</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Collapse */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveView('companion')}
                      className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-medium transition-colors"
                      title="Tune personality & memories"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Tune Companion</span>
                    </button>
                    <button
                      onClick={() => setShow3DHero(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Hide companion banner"
                      aria-label="Hide 3D companion banner"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-slate-300 flex items-center space-x-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{profile.name} Active</span>
                  </span>
                  <button
                    onClick={() => setShow3DHero(true)}
                    className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    aria-label="Show 3D companion banner"
                  >
                    <span>Show 3D Companion</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {currentConversation?.messages.map((message, idx) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    companionProfile={profile}
                    isLastModelMessage={
                      message.role === 'model' &&
                      idx === currentConversation.messages.length - 1
                    }
                    onRegenerate={() => {
                      // Grab last user message and resend
                      const lastUser = currentConversation.messages
                        .filter((m) => m.role === 'user')
                        .pop();
                      if (lastUser) {
                        handleSendMessage(lastUser.content, lastUser.files || []);
                      }
                    }}
                    onEditMessage={(id, newContent) => {
                      handleSendMessage(newContent, []);
                    }}
                    onContinue={() => {
                      handleSendMessage('Please continue where you left off.', []);
                    }}
                    onOpenInCodeStudio={handleOpenInCodeStudio}
                    onPlayVoice={(text) => handlePlayVoice(text, message.id)}
                    isSpeakingThis={speakingMessageId === message.id}
                  />
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
            </div>

            {/* Composer Input */}
            <div className="shrink-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/90 to-transparent pt-2">
              <ChatInput
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onStopGeneration={handleStopGeneration}
                activePersonality={profile.personality}
                onChangePersonality={(p) => setProfile((prev) => ({ ...prev, personality: p }))}
                selectedModel={settings.preferredModel}
                onChangeModel={(m) => setSettings((prev) => ({ ...prev, preferredModel: m }))}
                isVoiceListening={isVoiceListening}
                onToggleVoice={toggleVoiceListening}
                voiceTranscript={voiceTranscript}
              />
            </div>
          </div>
        )}

        {/* View 2: Professional Coding Studio */}
        {activeView === 'coding' && (
          <CodingStudio
            initialCode={studioInitialCode}
            initialLanguage={studioInitialLang}
            onSendToChat={(prompt) => {
              setActiveView('chat');
              handleSendMessage(prompt, []);
            }}
          />
        )}

        {/* View 3: Generative AI Tools Hub */}
        {activeView === 'tools' && <GenerativeTools />}

        {/* View 4: Companion Persona & Memory Studio */}
        {activeView === 'companion' && (
          <CompanionStudio
            profile={profile}
            onUpdateProfile={setProfile}
            onTestVoice={(text) => handlePlayVoice(text)}
          />
        )}
      </div>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        conversations={conversations}
        onClearAllChats={handleClearAllChats}
      />
    </div>
  );
}
