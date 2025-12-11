'use client';

import { useState, useEffect } from 'react';
import { useOllama } from './hooks/useOllama';
import { Sidebar } from './components/Sidebar';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { SetupModal } from './components/SetupModal';
import { ModelSelector } from './components/ModelSelector';
import { X } from 'lucide-react';
import { hasBaseUrl } from './lib/ollama';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    models,
    selectedModels,
    toggleModelSelection,
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
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline whitespace-nowrap">Models</span>
              <ModelSelector
                models={models}
                selectedModels={selectedModels}
                onToggleModel={toggleModelSelection}
                isConnected={isConnected}
              />

              {/* Selected Models Badges */}
              {selectedModels.length > 0 && (
                <div className="flex gap-2 overflow-x-auto hidden md:flex flex-shrink-0">
                  {selectedModels.slice(0, 2).map((model) => (
                    <div
                      key={model}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg whitespace-nowrap text-xs font-medium"
                    >
                      <span>{model}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModelSelection(model);
                        }}
                        className="hover:text-primary transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {selectedModels.length > 2 && (
                    <div className="flex items-center px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs font-medium flex-shrink-0">
                      +{selectedModels.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${isConnected
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
          selectedModel={selectedModels.length > 0 ? selectedModels[0] : 'No model selected'}
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
