'use client';

import { useState, useEffect } from 'react';
import { useOllama } from './hooks/useOllama';
import { Sidebar } from './components/Sidebar';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { SetupModal } from './components/SetupModal';
import { ChevronDown } from 'lucide-react';
import { hasBaseUrl } from './lib/ollama';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    models,
    selectedModel,
    setSelectedModel,
    isConnected,
    isLoading,
    conversations,
    currentConversation,
    setCurrentConversation,
    createNewConversation,
    sendMessage,
    deleteConversation,
    clearAllConversations,
    loadModels,
  } = useOllama();

  // Check if first time setup is needed
  useEffect(() => {
    const hasUrl = hasBaseUrl();
    setShowSetup(!hasUrl);
    setIsInitialized(true);
  }, []);

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadModels();
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Don't render until we've checked localStorage
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Setup Modal - shows on first visit */}
      <SetupModal isOpen={showSetup} onComplete={handleSetupComplete} />

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={setCurrentConversation}
        onNewChat={createNewConversation}
        onDeleteConversation={deleteConversation}
        onClearAll={clearAllConversations}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isConnected={isConnected}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-background to-secondary/20">
        {/* Top Header with Model Selector */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3 lg:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Model</span>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!isConnected || models.length === 0}
                  className="appearance-none pl-4 pr-10 py-2.5 text-sm font-medium bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 cursor-pointer hover:bg-secondary transition-colors min-w-[180px]"
                >
                  {models.length === 0 ? (
                    <option>No models available</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium ${isConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <ChatMessages
          messages={currentConversation?.messages || []}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Chat Input */}
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          isConnected={isConnected}
          selectedModel={selectedModel}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefresh={loadModels}
      />
    </div>
  );
}
