import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { feeds } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import Parser from 'rss-parser';
import { pollFeed } from '$lib/server/feeds';
import { safeFetch } from '$lib/server/ssrf';
import type { RequestHandler } from './$types';

const parser = new Parser();

export const POST: RequestHandler = async ({ request }) => {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
        throw error(400, 'A feed URL is required');
    }

    let normalizedUrl: string;
    try {
        normalizedUrl = new URL(url).toString();
    } catch {
        throw error(400, 'Not a valid URL');
    }

    const existing = await db.query.feeds.findFirst({
        where: eq(feeds.url, normalizedUrl)
    });
    if (existing) {
        throw error(409, 'This feed is already added');
    }

    let title: string | null = null;
    try {
        const res = await safeFetch(normalizedUrl);
        if (res.ok) {
            const xml = await res.text();
            const parsed = await parser.parseString(xml);
            title = parsed.title ?? null;
        }
    } catch {
        // fine — cron will pick up title on next poll if this fails
    }

    const [feed] = await db.insert(feeds).values({ url: normalizedUrl, title }).returning();

    // immediately poll this one feed so articles show up without waiting for the next cron cycle
    await pollFeed(feed).catch(() => { });

    return json(feed, { status: 201 });
};

export const GET: RequestHandler = async () => {
    const allFeeds = await db.query.feeds.findMany({
        where: (f, { eq }) => eq(f._deleted, false)
    });
    return json(allFeeds);
};