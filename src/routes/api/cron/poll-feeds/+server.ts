import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { pollAllFeeds } from '$lib/server/feeds';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const auth = request.headers.get('authorization');

    if (auth !== `Bearer ${env.CRON_SECRET}`) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await pollAllFeeds();
    return json({ results });
};