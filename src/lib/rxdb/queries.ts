import { getDb } from './index';
import type { ArticleDoc, FeedDoc } from './schemas';

export function watchFeeds(callback: (feeds: FeedDoc[]) => void) {
    let unsub: (() => void) | undefined;
    getDb().then((db) => {
        const sub = db.feeds
            .find({ selector: { _deleted: false } })
            .$.subscribe((docs) => callback(docs.map((d) => d.toJSON())));
        unsub = () => sub.unsubscribe();
    });
    return () => unsub?.();
}

export function watchArticles(feedId: string | null, callback: (articles: ArticleDoc[]) => void) {
    let unsub: (() => void) | undefined;
    getDb().then((db) => {
        const selector: Record<string, unknown> = { _deleted: false };
        if (feedId) selector.feedId = feedId;

        const sub = db.articles
            .find({ selector, sort: [{ publishedAt: 'desc' }] })
            .$.subscribe((docs) => callback(docs.map((d) => d.toJSON())));
        unsub = () => sub.unsubscribe();
    });
    return () => unsub?.();
}

export function watchStarredArticles(callback: (articles: ArticleDoc[]) => void) {
    let unsub: (() => void) | undefined;
    getDb().then((db) => {
        const sub = db.articles
            .find({ selector: { _deleted: false, isStarred: true }, sort: [{ publishedAt: 'desc' }] })
            .$.subscribe((docs) => callback(docs.map((d) => d.toJSON())));
        unsub = () => sub.unsubscribe();
    });
    return () => unsub?.();
}

export async function toggleRead(articleId: string, isRead: boolean) {
    const db = await getDb();
    const doc = await db.articles.findOne(articleId).exec();
    await doc?.patch({ isRead, updatedAt: new Date().toISOString() });
}

export async function toggleStarred(articleId: string, isStarred: boolean) {
    const db = await getDb();
    const doc = await db.articles.findOne(articleId).exec();
    await doc?.patch({ isStarred, updatedAt: new Date().toISOString() });
}