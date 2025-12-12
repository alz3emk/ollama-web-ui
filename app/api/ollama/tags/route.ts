export async function GET(request: Request) {
    try {
        // Get the Ollama URL from the request header (sent by the client from localStorage)
        const ollamaUrl = request.headers.get('x-ollama-url');

        if (!ollamaUrl) {
            return Response.json(
                { error: 'Ollama URL not configured. Please complete the setup.', models: [] },
                { status: 200 }
            );
        }

        // Ensure no trailing slash
        const cleanUrl = ollamaUrl.replace(/\/$/, '');

        console.log('[/api/ollama/tags] Attempting to fetch from:', cleanUrl);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const fetchOptions: RequestInit = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            };

            const response = await fetch(`${cleanUrl}/api/tags`, fetchOptions);

            clearTimeout(timeout);

            if (!response.ok) {
                console.error(`[/api/ollama/tags] Ollama returned ${response.status}`);
                return Response.json(
                    { error: `Ollama server error: ${response.status}`, models: [] },
                    { status: 200 }
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
                        error: 'Ollama server timeout. Make sure Ollama is running and accessible at: ' + cleanUrl,
                        models: []
                    },
                    { status: 200 }
                );
            }

            console.error('[/api/ollama/tags] Connection error:', {
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
                { error: errorMessage, models: [] },
                { status: 200 }
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
            'Access-Control-Allow-Headers': 'Content-Type, x-ollama-url',
        },
    });
}
