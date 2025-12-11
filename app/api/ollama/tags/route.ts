export async function GET(request: Request) {
    try {
        // Try multiple sources for the Ollama URL
        const ollamaUrl =
            process.env.NEXT_PUBLIC_OLLAMA_URL ||
            process.env.OLLAMA_URL ||
            'http://localhost:11434';

        console.log('[/api/ollama/tags] Attempting to fetch from:', ollamaUrl);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const response = await fetch(`${ollamaUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                console.error(`[/api/ollama/tags] Ollama returned ${response.status}`);
                return Response.json(
                    { error: `Ollama server error: ${response.status}`, models: [] },
                    { status: 200 } // Return 200 so UI doesn't show error
                );
            }

            const data = await response.json();
            console.log(`[/api/ollama/tags] Successfully fetched ${data.models?.length || 0} models`);

            return Response.json(data, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        } catch (fetchError: any) {
            clearTimeout(timeout);

            if (fetchError.name === 'AbortError') {
                console.error('[/api/ollama/tags] Request timeout after 10 seconds');
                return Response.json(
                    {
                        error: 'Ollama server timeout. Make sure Ollama is running and accessible at: ' + ollamaUrl,
                        models: []
                    },
                    { status: 200 }
                );
            }

            console.error('[/api/ollama/tags] Connection error:', fetchError.code || fetchError.message);

            // Return helpful error message
            const errorMessage = fetchError.code === 'ECONNREFUSED'
                ? `Cannot connect to Ollama server at ${ollamaUrl}. Make sure Ollama is running: ollama serve`
                : `Connection error: ${fetchError.message}`;

            return Response.json(
                { error: errorMessage, models: [] },
                { status: 200 } // Return 200 so UI doesn't show error
            );
        }
    } catch (error: any) {
        console.error('[/api/ollama/tags] Unexpected error:', error);
        return Response.json(
            { error: 'Internal server error: ' + error.message, models: [] },
            { status: 200 }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
