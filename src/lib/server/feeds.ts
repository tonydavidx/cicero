import Parser from 'rss-parser';
import { db } from './db';
import { feeds, articles } from './db/schema';
import { eq } from 'drizzle-orm';
import { safeFetch } from './ssrf';

const parser = new Parser();

export async function pollFeed(feed: typeof feeds.$inferSelect) {
    const headers: Record<string, string> = {};
    if (feed.etag) headers['If-None-Match'] = feed.etag;
    if (feed.lastModified) headers['If-Modified-Since'] = feed.lastModified;

    const res = await safeFetch(feed.url, { headers });

    if (res.status === 304) {
        await db.update(feeds).set({ lastFetchedAt: new Date() }).where(eq(feeds.id, feed.id));
        return { feedId: feed.id, status: 'not-modified', newArticles: 0 };
    }

    if (!res.ok) {
        return { feedId: feed.id, status: 'error', error: `HTTP ${res.status}`, newArticles: 0 };
    }

    const xml = await res.text();
    const parsed = await parser.parseString(xml);

    const faviconUrl = extractFavicon(parsed, feed.url);

    let newArticles = 0;
    for (const item of parsed.items) {
        const guid = item.guid ?? item.link ?? item.title;
        if (!guid || !item.link) continue;

        const existing = await db.query.articles.findFirst({
            where: (a, { and, eq }) => and(eq(a.feedId, feed.id), eq(a.guid, guid))
        });
        if (existing) continue;

        const imageUrl = extractArticleImage(item);

        await db.insert(articles).values({
            feedId: feed.id,
            guid,
            url: item.link,
            title: item.title ?? '(untitled)',
            author: item.creator ?? item.author ?? null,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
            contentRaw: item.content ?? item.contentSnippet ?? null,
            excerpt: item.contentSnippet ?? null,
            contentStatus: 'unfetched',
            imageUrl
        });
        newArticles++;
    }

    await db
        .update(feeds)
        .set({
            lastFetchedAt: new Date(),
            etag: res.headers.get('etag') ?? null,
            lastModified: res.headers.get('last-modified') ?? null,
            title: feed.title ?? parsed.title ?? null,
            faviconUrl: faviconUrl ?? feed.faviconUrl
        })
        .where(eq(feeds.id, feed.id));

    return { feedId: feed.id, status: 'ok', newArticles };
}

function extractArticleImage(item: Parser.Item): string | null {
    const enclosure = item.enclosure;
    if (enclosure?.url && enclosure.type?.startsWith('image/')) {
        return enclosure.url;
    }

    const media = (item as Record<string, unknown>)['media:content'] as
        | { $?: { url?: string }; url?: string }
        | undefined;
    if (media?.$?.url) return media.$.url;
    if (media?.url) return media.url;

    const mediaThumbnail = (item as Record<string, unknown>)['media:thumbnail'] as
        | { $?: { url?: string }; url?: string }
        | undefined;
    if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;
    if (mediaThumbnail?.url) return mediaThumbnail.url;

    const content = item.content ?? item.contentSnippet ?? '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];

    return null;
}

function extractFavicon(parsed: { image?: { url?: string }; icon?: string; logo?: string }, feedUrl: string): string | null {
    const fromFeed = parsed.image?.url ?? parsed.icon ?? parsed.logo ?? null;
    if (fromFeed) return fromFeed;

    try {
        const domain = new URL(feedUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return null;
    }
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