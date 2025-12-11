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
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

    // Load saved data from localStorage
    useEffect(() => {
        const savedModel = localStorage.getItem('ollama_selected_model');
        const savedConversations = localStorage.getItem('ollama_conversations');

        if (savedModel) setSelectedModel(savedModel);
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

    // Save selected model
    useEffect(() => {
        if (selectedModel) {
            localStorage.setItem('ollama_selected_model', selectedModel);
        }
    }, [selectedModel]);

    const loadModels = useCallback(async () => {
        const connected = await checkConnection();
        setIsConnected(connected);

        if (connected) {
            const modelList = await fetchModels();
            setModels(modelList);

            if (modelList.length > 0 && !selectedModel) {
                setSelectedModel(modelList[0].name);
            }
        }
    }, [selectedModel]);

    useEffect(() => {
        loadModels();
    }, [loadModels]);

    const createNewConversation = useCallback(() => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            model: selectedModel,
            createdAt: new Date(),
        };
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        return newConversation;
    }, [selectedModel]);

    const sendMessage = useCallback(async (content: string, images?: string[]) => {
        if (!selectedModel || (!content.trim() && !images?.length)) return;

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
        let assistantContent = '';

        try {
            const assistantMessage: ChatMessage = { role: 'assistant', content: '' };

            // Add empty assistant message that will be updated
            const messagesWithAssistant = [...updatedMessages, assistantMessage];

            for await (const chunk of streamChat(selectedModel, updatedMessages)) {
                assistantContent += chunk;

                // Update the assistant message content in real-time
                const streamingConversation: Conversation = {
                    ...updatedConversation,
                    messages: [
                        ...updatedMessages,
                        { role: 'assistant', content: assistantContent }
                    ],
                };

                setCurrentConversation(streamingConversation);
                setConversations(prev =>
                    prev.map(c => c.id === streamingConversation.id ? streamingConversation : c)
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            assistantContent = 'Sorry, there was an error processing your request. Please check your Ollama connection.';

            const errorConversation: Conversation = {
                ...updatedConversation,
                messages: [
                    ...updatedMessages,
                    { role: 'assistant', content: assistantContent }
                ],
            };

            setCurrentConversation(errorConversation);
            setConversations(prev =>
                prev.map(c => c.id === errorConversation.id ? errorConversation : c)
            );
        } finally {
            setIsLoading(false);
        }
    }, [selectedModel, currentConversation, createNewConversation]);

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
    };
}
