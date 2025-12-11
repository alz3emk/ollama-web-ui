export async function POST(request: Request) {
    try {
        // Try multiple sources for the Ollama URL
        const ollamaUrl =
            process.env.NEXT_PUBLIC_OLLAMA_URL ||
            process.env.OLLAMA_URL ||
            'http://localhost:11434';

        console.log('[/api/ollama/chat] Attempting to connect to:', ollamaUrl);

        const body = await request.json();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for streaming

        try {
            const response = await fetch(`${ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                console.error(`[/api/ollama/chat] Ollama returned ${response.status}`);
                return Response.json(
                    { error: `Ollama server error: ${response.status}` },
                    { status: response.status }
                );
            }

            console.log('[/api/ollama/chat] Connected successfully, streaming response');

            // Stream the response back to the client
            return new Response(response.body, {
                headers: {
                    'Content-Type': 'application/x-ndjson',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        } catch (fetchError: any) {
            clearTimeout(timeout);

            if (fetchError.name === 'AbortError') {
                console.error('[/api/ollama/chat] Request timeout after 2 minutes');
                return Response.json(
                    { error: 'Ollama server timeout. The request took too long.' },
                    { status: 504 }
                );
            }

            console.error('[/api/ollama/chat] Connection error:', fetchError.code || fetchError.message);

            // Return helpful error message
            const errorMessage = fetchError.code === 'ECONNREFUSED'
                ? `Cannot connect to Ollama server at ${ollamaUrl}. Make sure Ollama is running: ollama serve`
                : `Connection error: ${fetchError.message}`;

            return Response.json(
                { error: errorMessage },
                { status: 503 }
            );
        }
    } catch (error: any) {
        console.error('[/api/ollama/chat] Unexpected error:', error);
        return Response.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
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
