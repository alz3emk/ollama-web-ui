export async function GET(request: Request) {
    try {
        const ollamaUrl = request.headers.get('x-ollama-url');

        if (!ollamaUrl) {
            return Response.json({
                error: 'Ollama URL not configured. Please complete the setup.',
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        const cleanUrl = ollamaUrl.replace(/\/$/, '');

        const diagnostics = {
            timestamp: new Date().toISOString(),
            ollamaUrl: cleanUrl,
            tests: {} as any,
        };

        // Test 1: Basic connectivity
        try {
            console.log('[/api/ollama/diagnostics] Testing basic connectivity to', cleanUrl);
            const response = await fetch(`${cleanUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000),
            });

            diagnostics.tests.basicConnectivity = {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
            };

            if (response.ok) {
                const data = await response.json();
                diagnostics.tests.basicConnectivity.modelsCount = data.models?.length || 0;
            }
        } catch (error: any) {
            diagnostics.tests.basicConnectivity = {
                success: false,
                error: error.message,
                code: error.code,
                cause: error.cause?.message,
            };
        }

        // Test 2: Check if URL is valid
        try {
            const url = new URL(cleanUrl);
            diagnostics.tests.urlParsing = {
                success: true,
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || 'default',
            };
        } catch (error: any) {
            diagnostics.tests.urlParsing = {
                success: false,
                error: error.message,
            };
        }

        // Test 3: DNS resolution
        try {
            const url = new URL(cleanUrl);
            const { resolve4, resolve6 } = require('dns').promises;

            const ipv4 = await resolve4(url.hostname).catch(() => null);
            const ipv6 = await resolve6(url.hostname).catch(() => null);

            diagnostics.tests.dnsResolution = {
                hostname: url.hostname,
                ipv4: ipv4 || 'not resolved',
                ipv6: ipv6 || 'not resolved',
            };
        } catch (error: any) {
            diagnostics.tests.dnsResolution = {
                error: error.message,
            };
        }

        return Response.json(diagnostics);
    } catch (error: any) {
        return Response.json(
            { error: error.message, timestamp: new Date().toISOString() },
            { status: 500 }
        );
    }
}
