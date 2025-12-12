export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    images?: string[]; // Base64 encoded images for vision models
    model?: string; // Which model generated this message (for assistant messages)
}

export interface ChatResponse {
    model: string;
    created_at: string;
    message: ChatMessage;
    done: boolean;
}

const STORAGE_KEY = 'ollama_base_url';

export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY) || '';
    }
    return '';
}

export function setBaseUrl(url: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, url);
    }
}

export function hasBaseUrl(): boolean {
    if (typeof window !== 'undefined') {
        const url = localStorage.getItem(STORAGE_KEY);
        return !!url && url.trim().length > 0;
    }
    return false;
}

export async function fetchModels(): Promise<OllamaModel[]> {
    try {
        const baseUrl = getBaseUrl();
        // Use the backend proxy endpoint with the stored URL in header
        const response = await fetch('/api/ollama/tags', {
            headers: {
                'x-ollama-url': baseUrl,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        return data.models || [];
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
}

// Check if a model supports vision (common vision model patterns)
export function isVisionModel(modelName: string): boolean {
    const visionPatterns = ['llava', 'vision', 'bakllava', 'moondream', 'cogvlm', 'minicpm-v'];
    return visionPatterns.some(pattern => modelName.toLowerCase().includes(pattern));
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function* streamChat(
    model: string,
    messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
    const baseUrl = getBaseUrl();
    // Format messages for Ollama API (include images if present)
    const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.images && msg.images.length > 0 ? { images: msg.images } : {}),
    }));

    // Use the backend proxy endpoint with the stored URL in header
    const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-ollama-url': baseUrl,
        },
        body: JSON.stringify({
            model,
            messages: formattedMessages,
            stream: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                    yield json.message.content;
                }
            } catch {
                // Skip invalid JSON lines
            }
        }
    }
}

export async function checkConnection(): Promise<boolean> {
    try {
        const baseUrl = getBaseUrl();
        // Use the backend proxy endpoint with the stored URL in header
        const response = await fetch('/api/ollama/tags', {
            headers: {
                'x-ollama-url': baseUrl,
            },
        });
        return response.ok;
    } catch {
        return false;
    }
}
