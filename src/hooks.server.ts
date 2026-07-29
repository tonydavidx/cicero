import { verifySessionToken, verifyCsrf, COOKIE_NAME } from '$lib/server/auth';
import { ensureTables } from '$lib/server/db/migrate';
import type { Handle } from '@sveltejs/kit';

// Auto-create tables on first request (idempotent — only runs CREATE IF NOT EXISTS once)
let migrated = false;

export const handle: Handle = async ({ event, resolve }) => {
    if (!migrated) {
        migrated = true;
        ensureTables().catch((e) => console.error('Migration failed:', e));
    }
    const method = event.request.method;
    const path = event.url.pathname;
    const isApiRoute = path.startsWith('/api/');

    if (isApiRoute && method !== 'GET' && method !== 'HEAD') {
        const isCron = path === '/api/cron/poll-feeds';

        if (!isCron && !verifyCsrf(event.request, event.url)) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { 'content-type': 'application/json' }
            });
        }

        const isPublic = path === '/api/login' || isCron;

        if (!isPublic) {
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
    }

    return resolve(event);
};