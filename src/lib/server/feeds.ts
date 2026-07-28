import Parser from 'rss-parser';
import { db } from './db';
import { feeds, articles } from './db/schema';
import { eq } from 'drizzle-orm';

const parser = new Parser();

export async function pollFeed(feed: typeof feeds.$inferSelect) {
    const headers: Record<string, string> = {};
    if (feed.etag) headers['If-None-Match'] = feed.etag;
    if (feed.lastModified) headers['If-Modified-Since'] = feed.lastModified;

    const res = await fetch(feed.url, { headers });

    if (res.status === 304) {
        await db.update(feeds).set({ lastFetchedAt: new Date() }).where(eq(feeds.id, feed.id));
        return { feedId: feed.id, status: 'not-modified', newArticles: 0 };
    }

    if (!res.ok) {
        return { feedId: feed.id, status: 'error', error: `HTTP ${res.status}`, newArticles: 0 };
    }

    const xml = await res.text();
    const parsed = await parser.parseString(xml);

    let newArticles = 0;
    for (const item of parsed.items) {
        const guid = item.guid ?? item.link ?? item.title;
        if (!guid || !item.link) continue;

        const existing = await db.query.articles.findFirst({
            where: (a, { and, eq }) => and(eq(a.feedId, feed.id), eq(a.guid, guid))
        });
        if (existing) continue;

        await db.insert(articles).values({
            feedId: feed.id,
            guid,
            url: item.link,
            title: item.title ?? '(untitled)',
            author: item.creator ?? item.author ?? null,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
            contentRaw: item.content ?? item.contentSnippet ?? null,
            excerpt: item.contentSnippet ?? null,
            contentStatus: 'unfetched'
        });
        newArticles++;
    }

    await db
        .update(feeds)
        .set({
            lastFetchedAt: new Date(),
            etag: res.headers.get('etag') ?? null,
            lastModified: res.headers.get('last-modified') ?? null,
            title: feed.title ?? parsed.title ?? null
        })
        .where(eq(feeds.id, feed.id));

    return { feedId: feed.id, status: 'ok', newArticles };
}

export async function pollAllFeeds() {
    const allFeeds = await db.query.feeds.findMany();
    const results = [];
    for (const feed of allFeeds) {
        try {
            results.push(await pollFeed(feed));
        } catch (err) {
            results.push({ feedId: feed.id, status: 'error', error: String(err), newArticles: 0 });
        }
    }
    return results;
}