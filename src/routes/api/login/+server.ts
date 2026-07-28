import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
        return json({ error: 'Password required' }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, env.AUTH_PASSWORD_HASH!);
    if (!valid) {
        return json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = await createSessionToken();
    cookies.set(COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: MAX_AGE_SECONDS
    });

    return json({ ok: true });
};