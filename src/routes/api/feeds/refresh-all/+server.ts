import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { feeds } from '$lib/server/db/schema';
import { pollAllFeeds } from '$lib/server/feeds';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const DEBOUNCE_MS = 15 * 60 * 1000; // 15 minutes

export const POST: RequestHandler = async () => {
    const [{ maxFetchedAt }] = await db
        .select({ maxFetchedAt: sql<string | null>`MAX(${feeds.lastFetchedAt})` })
        .from(feeds);

    if (maxFetchedAt) {
        const elapsed = Date.now() - new Date(maxFetchedAt).getTime();
        if (elapsed < DEBOUNCE_MS) {
            return json({
                skipped: true,
                reason: 'debounced',
                nextAvailableInMs: DEBOUNCE_MS - elapsed
            });
        }
    }

    const results = await pollAllFeeds();
    return json({ skipped: false, results });
};