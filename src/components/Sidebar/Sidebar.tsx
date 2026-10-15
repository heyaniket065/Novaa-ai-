import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Code2,
  Sparkles,
  Bot,
  Settings as SettingsIcon,
  Trash2,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import type { Conversation, CompanionProfile } from '../../types/index.ts';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  activeView: 'chat' | 'coding' | 'tools' | 'companion';
  onSelectView: (view: 'chat' | 'coding' | 'tools' | 'companion') => void;
  onOpenSettings: () => void;
  companionProfile: CompanionProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  activeView,
  onSelectView,
  onOpenSettings,
  companionProfile,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameChat(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const navItems = [
    { id: 'chat', label: 'Conversations', icon: MessageSquare },
    { id: 'coding', label: 'Coding Studio', icon: Code2 },
    { id: 'tools', label: 'Generative Tools', icon: Sparkles },
    { id: 'companion', label: 'Companion Studio', icon: Bot },
  ] as const;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0f1d] border-r border-slate-800 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white">NOVA AI STUDIO</span>
              <span className="block text-[10px] text-indigo-400 font-medium">Companion & IDE Suite</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation Views */}
      <div className="p-2 space-y-1 border-b border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* New Chat & History Section (Only shown when not collapsed) */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onSelectView('chat');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>New Conversation</span>
          </button>

          {/* Search Chats */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block py-1">
              Recent Chats
            </span>

            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isActive = activeConversationId === conv.id && activeView === 'chat';
                const isEditingThis = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onSelectView('chat');
                      onCloseMobile();
                    }}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-white font-medium border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {isEditingThis ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1.5 py-0.5 rounded bg-slate-950 border border-indigo-500 text-xs text-white"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate block">{conv.title}</span>
                      )}
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditingThis ? (
                        <button
                          onClick={(e) => saveRename(conv.id, e)}
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                          title="Save title"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => startRename(conv, e)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                          title="Rename chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${conv.title}"?`)) {
                            onDeleteChat(conv.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-600 text-xs">
                No matching conversations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer: Companion Status & Settings */}
      <div className="p-3 border-t border-slate-800 shrink-0 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-200 block truncate">{companionProfile.name}</span>
                <span className="text-[10px] text-slate-500 capitalize">{companionProfile.personality.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs font-semibold transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="App Settings"
        >
          <SettingsIcon className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block h-screen shrink-0 transition-all duration-300 z-20 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 h-full max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
