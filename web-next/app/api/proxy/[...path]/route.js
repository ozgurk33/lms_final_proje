export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://brycen-supertranscendent-interchangeably.ngrok-free.dev';

async function proxyRequest(request, { params }) {
    const path = params.path.join('/');
    // Preserve query parameters
    const queryString = request.url.includes('?') ? '?' + request.url.split('?')[1] : '';
    const url = `${BACKEND_URL}/api/${path}${queryString}`;

    const method = request.method;

    const headers = {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
    };

    try {
        const options = {
            method,
            headers,
        };

        if (method !== 'GET' && method !== 'HEAD') {
            const body = await request.text();
            if (body) {
                options.body = body;
            }
        }

        const response = await fetch(url, options);

        // Handle 204 No Content separately (cannot have body)
        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        return Response.json(data, { status: response.status });
    } catch (error) {
        console.error('Proxy Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request, context) { return proxyRequest(request, context); }
export async function POST(request, context) { return proxyRequest(request, context); }
export async function PUT(request, context) { return proxyRequest(request, context); }
export async function DELETE(request, context) { return proxyRequest(request, context); }
export async function PATCH(request, context) { return proxyRequest(request, context); }
export async function OPTIONS(request, context) { return proxyRequest(request, context); }
export async function HEAD(request, context) { return proxyRequest(request, context); }
