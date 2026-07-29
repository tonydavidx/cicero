import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from '$lib/server/auth';
import { checkRateLimit } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
    const ip = getClientAddress();
    const { allowed, remaining, resetIn } = checkRateLimit(`login:${ip}`);

    if (!allowed) {
        return json(
            { error: 'Too many attempts. Try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil(resetIn / 1000)),
                    'X-RateLimit-Remaining': '0',
                },
            },
        );
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
        return json({ error: 'Password required' }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, env.AUTH_PASSWORD_HASH!);
    if (!valid) {
        return json(
            { error: 'Invalid password' },
            {
                status: 401,
                headers: { 'X-RateLimit-Remaining': String(remaining) },
            },
        );
    }

    const token = await createSessionToken();
    cookies.set(COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: MAX_AGE_SECONDS,
    });

    return json({ ok: true });
};