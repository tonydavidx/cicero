import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import createDOMPurify from 'dompurify';
import { db } from './db';
import { articles } from './db/schema';
import { eq } from 'drizzle-orm';
import { safeFetch } from './ssrf';

export async function fetchFullArticle(articleId: string) {
    const article = await db.query.articles.findFirst({
        where: eq(articles.id, articleId)
    });

    if (!article) {
        return { status: 'not-found' as const };
    }

    if (article.contentStatus === 'fetched' && article.contentFull) {
        return { status: 'fetched' as const, content: article.contentFull };
    }

    try {
        const res = await safeFetch(article.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CiceroReader/1.0)' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        const dom = new JSDOM(html, { url: article.url });
        const reader = new Readability(dom.window.document);
        const parsed = reader.parse();

        if (!parsed?.content) throw new Error('Readability returned no content');

        const window = new JSDOM('').window;
        const DOMPurify = createDOMPurify(window as unknown as Window & typeof globalThis);
        const clean = DOMPurify.sanitize(parsed.content);

        await db
            .update(articles)
            .set({ contentFull: clean, contentStatus: 'fetched', updatedAt: new Date() })
            .where(eq(articles.id, articleId));

        return { status: 'fetched' as const, content: clean };
    } catch (err) {
        await db
            .update(articles)
            .set({ contentStatus: 'failed', updatedAt: new Date() })
            .where(eq(articles.id, articleId));

        return { status: 'failed' as const, error: String(err) };
    }
}