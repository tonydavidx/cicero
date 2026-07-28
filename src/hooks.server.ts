import { verifySessionToken, COOKIE_NAME } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const isApiRoute = event.url.pathname.startsWith('/api/');
    const isPublicApiRoute = event.url.pathname === '/api/login';

    if (isApiRoute && !isPublicApiRoute) {
        const token = event.cookies.get(COOKIE_NAME);
        const payload = token ? await verifySessionToken(token) : null;

        if (!payload) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' }
            });
        }

        event.locals.user = payload;
    }

    return resolve(event);
};