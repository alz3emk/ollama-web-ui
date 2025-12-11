'use client';

import { useState, useEffect, useCallback } from 'react';
import { OllamaModel, ChatMessage, fetchModels, streamChat, checkConnection } from '../lib/ollama';

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    model: string;
    createdAt: Date;
}

// Helper to strip images from messages for storage (images are too large for localStorage)
function stripImagesFromConversations(conversations: Conversation[]): Conversation[] {
    return conversations.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            // Don't store images - they're too large for localStorage
        }))
    }));
}

// Max conversations to store
const MAX_STORED_CONVERSATIONS = 50;

export function useOllama() {
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

    // Load saved data from localStorage
    useEffect(() => {
        const savedModels = localStorage.getItem('ollama_selected_models');
        const savedConversations = localStorage.getItem('ollama_conversations');

        if (savedModels) {
            try {
                const parsed = JSON.parse(savedModels);
                console.log('Loaded saved models:', parsed);
                setSelectedModels(parsed);
            } catch (e) {
                console.error('Failed to parse saved models:', e);
            }
        }
        if (savedConversations) {
            try {
                const parsed = JSON.parse(savedConversations);
                setConversations(parsed);
            } catch {
                // Invalid JSON, ignore
            }
        }
    }, []);

    // Save conversations to localStorage (without images, limited count)
    useEffect(() => {
        if (conversations.length > 0) {
            try {
                const toStore = stripImagesFromConversations(
                    conversations.slice(0, MAX_STORED_CONVERSATIONS)
                );
                localStorage.setItem('ollama_conversations', JSON.stringify(toStore));
            } catch (e) {
                // If still too large, store fewer conversations
                console.warn('Failed to save conversations, reducing stored count');
                try {
                    const toStore = stripImagesFromConversations(
                        conversations.slice(0, 20)
                    );
                    localStorage.setItem('ollama_conversations', JSON.stringify(toStore));
                } catch {
                    // Last resort: clear old data
                    localStorage.removeItem('ollama_conversations');
                }
            }
        }
    }, [conversations]);

    // Save selected models
    useEffect(() => {
        if (selectedModels.length > 0) {
            console.log('Saving selected models:', selectedModels);
            localStorage.setItem('ollama_selected_models', JSON.stringify(selectedModels));
        }
    }, [selectedModels]);

    const loadModels = useCallback(async () => {
        console.log('Loading models...');
        const connected = await checkConnection();
        setIsConnected(connected);

        if (connected) {
            const modelList = await fetchModels();
            console.log('Fetched models:', modelList);
            setModels(modelList);

            // Only set default model if none are selected yet
            setSelectedModels(prev => {
                if (prev.length === 0 && modelList.length > 0) {
                    console.log('Setting default model:', modelList[0].name);
                    return [modelList[0].name];
                }
                return prev;
            });
        }
    }, []);

    useEffect(() => {
        loadModels();
    }, [loadModels]);

    const createNewConversation = useCallback(() => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            model: selectedModels.join(', ') || 'no-model',
            createdAt: new Date(),
        };
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        return newConversation;
    }, [selectedModels]);

    const toggleModelSelection = useCallback((modelName: string) => {
        console.log('Toggling model selection:', modelName);
        setSelectedModels(prev => {
            if (prev.includes(modelName)) {
                // Remove model
                const updated = prev.filter(m => m !== modelName);
                console.log('Removed model, now selected:', updated);
                return updated;
            } else {
                // Add model
                const updated = [...prev, modelName];
                console.log('Added model, now selected:', updated);
                return updated;
            }
        });
    }, []);

    const sendMessage = useCallback(async (content: string, images?: string[]) => {
        if (selectedModels.length === 0 || (!content.trim() && !images?.length)) return;

        let conversation = currentConversation;
        if (!conversation) {
            conversation = createNewConversation();
        }

        const userMessage: ChatMessage = {
            role: 'user',
            content: content || 'What is in this image?',
            ...(images && images.length > 0 ? { images } : {})
        };
        const updatedMessages = [...conversation.messages, userMessage];

        // Update conversation with user message
        const updatedConversation: Conversation = {
            ...conversation,
            messages: updatedMessages,
            title: conversation.messages.length === 0
                ? (images?.length ? '🖼️ ' : '') + (content || 'Image analysis').slice(0, 30) + '...'
                : conversation.title,
        };

        setCurrentConversation(updatedConversation);
        setConversations(prev =>
            prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
        );

        setIsLoading(true);

        try {
            // Send message to each selected model
            for (const model of selectedModels) {
                let assistantContent = '';

                try {
                    let messagesForStreaming = [...updatedMessages];

                    for await (const chunk of streamChat(model, messagesForStreaming)) {
                        assistantContent += chunk;

                        // Update the conversation with the streaming response from this model
                        setCurrentConversation(prev => {
                            if (!prev) return prev;

                            const lastMessage = prev.messages[prev.messages.length - 1];
                            let newMessages = [...prev.messages];

                            // If the last message is from this model's assistant, update it
                            if (lastMessage?.role === 'assistant' && lastMessage?.model === model) {
                                newMessages[newMessages.length - 1] = {
                                    ...lastMessage,
                                    content: assistantContent
                                };
                            } else {
                                // Add new assistant message
                                newMessages.push({
                                    role: 'assistant',
                                    content: assistantContent,
                                    model
                                });
                            }

                            const streamingConversation: Conversation = {
                                ...prev,
                                messages: newMessages
                            };

                            return streamingConversation;
                        });

                        setConversations(prev =>
                            prev.map(c => c.id === conversation.id ? {
                                ...c,
                                messages: c.id === conversation.id ? c.messages : c.messages
                            } : c)
                        );
                    }
                } catch (error) {
                    console.error(`Error from model ${model}:`, error);
                    assistantContent = `Sorry, there was an error with ${model}. Please check your Ollama connection.`;

                    setCurrentConversation(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            messages: [
                                ...prev.messages,
                                { role: 'assistant', content: assistantContent, model }
                            ]
                        };
                    });
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedModels, currentConversation, createNewConversation]);

    const deleteConversation = useCallback((id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversation?.id === id) {
            setCurrentConversation(null);
        }
    }, [currentConversation]);

    const clearAllConversations = useCallback(() => {
        setConversations([]);
        setCurrentConversation(null);
        localStorage.removeItem('ollama_conversations');
    }, []);

    return {
        models,
        selectedModels,
        setSelectedModels,
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
    };
}
