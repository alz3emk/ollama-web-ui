'use client';

import { useState } from 'react';
import {
    Plus,
    MessageSquare,
    Trash2,
    Settings,
    X,
    Menu,
    Sparkles,
    Sun,
    Moon,
    Monitor,
    Globe
} from 'lucide-react';
import { Conversation } from '../hooks/useOllama';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

interface SidebarProps {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    onSelectConversation: (conversation: Conversation) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: string) => void;
    onClearAll: () => void;
    onOpenSettings: () => void;
    isConnected: boolean;
}

export function Sidebar({
    conversations,
    currentConversation,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
    onClearAll,
    onOpenSettings,
    isConnected,
}: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    const themeOptions = [
        { value: 'light' as const, icon: Sun, label: t('light') },
        { value: 'dark' as const, icon: Moon, label: t('dark') },
        { value: 'system' as const, icon: Monitor, label: t('system') },
    ];

    const languageOptions = [
        { value: 'en' as const, label: 'English' },
        { value: 'ar' as const, label: 'العربية' },
    ];

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-card border border-border shadow-lg lg:hidden hover:bg-secondary transition-all"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Header */}
                <div className="p-5 border-b border-border">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg glow">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-lg">{t('app.title')}</span>
                                <p className="text-xs text-muted-foreground">{t('sidebar.aiChat')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-lg hover:bg-secondary lg:hidden transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Connection status */}
                    <div className={`flex items-center gap-2.5 text-sm px-4 py-2.5 rounded-xl font-medium ${isConnected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? t('nav.connected') : t('nav.disconnected')}
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={() => {
                            onNewChat();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        {t('nav.newChat')}
                    </button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                        {t('nav.recentChats')}
                    </p>
                    <div className="space-y-1.5">
                        {conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${currentConversation?.id === conversation.id
                                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 shadow-sm'
                                        : 'hover:bg-secondary border border-transparent'
                                    }`}
                                onClick={() => {
                                    onSelectConversation(conversation);
                                    setIsOpen(false);
                                }}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentConversation?.id === conversation.id
                                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}>
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="flex-1 truncate text-sm font-medium">{conversation.title}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteConversation(conversation.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {conversations.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-muted-foreground">{t('sidebar.noConversations')}</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">{t('sidebar.noConversationsDesc')}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border space-y-3">
                    {/* Language Toggle */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">{t('language')}</p>
                        <div className="flex items-center gap-2">
                            {languageOptions.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setLanguage(value)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${language === value
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm'
                                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">{t('theme')}</p>
                        <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
                            {themeOptions.map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setTheme(value)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${theme === value
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {conversations.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('nav.clearAll')}
                        </button>
                    )}
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary rounded-xl transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        {t('nav.settings')}
                    </button>
                </div>
            </aside>
        </>
    );
}
