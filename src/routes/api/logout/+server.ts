import { json } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
    cookies.delete(COOKIE_NAME, { path: '/' });
    return json({ ok: true });
};