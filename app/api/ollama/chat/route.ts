export async function POST(request: Request) {
    try {
        // Get the Ollama URL from the request header (sent by the client from localStorage)
        const ollamaUrl = request.headers.get('x-ollama-url');

        if (!ollamaUrl) {
            return Response.json(
                { error: 'Ollama URL not configured. Please complete the setup.' },
                { status: 400 }
            );
        }

        // Ensure no trailing slash
        const cleanUrl = ollamaUrl.replace(/\/$/, '');

        console.log('[/api/ollama/chat] Attempting to connect to:', cleanUrl);

        const body = await request.json();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for streaming

        try {
            const fetchOptions: RequestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            };

            const response = await fetch(`${cleanUrl}/api/chat`, fetchOptions);

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

            console.error('[/api/ollama/chat] Connection error:', {
                code: fetchError.code,
                message: fetchError.message,
                cause: fetchError.cause?.message,
            });

            // Provide more detailed error messages
            let errorMessage = `Connection error: ${fetchError.message}`;

            if (fetchError.code === 'ECONNREFUSED') {
                errorMessage = `Cannot connect to Ollama at ${cleanUrl}. Server refused connection. Make sure Ollama is running: ollama serve`;
            } else if (fetchError.code === 'ENOTFOUND') {
                errorMessage = `Cannot resolve hostname in ${cleanUrl}. Check the URL is correct.`;
            } else if (fetchError.message?.includes('certificate')) {
                errorMessage = `SSL certificate error for ${cleanUrl}. If using self-signed certificates, the server may need certificate configuration.`;
            } else if (fetchError.message?.includes('ERR_TLS_CERT_ALTNAME_INVALID')) {
                errorMessage = `SSL certificate name mismatch for ${cleanUrl}. The certificate doesn't match the hostname.`;
            }

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
            'Access-Control-Allow-Headers': 'Content-Type, x-ollama-url',
        },
    });
}
