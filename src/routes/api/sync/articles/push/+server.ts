import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articleState } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const rows = (await request.json()) as Array<{
        newDocumentState: { id: string; isRead: boolean; isStarred: boolean };
    }>;

    for (const row of rows) {
        const { id, isRead, isStarred } = row.newDocumentState;
        await db
            .insert(articleState)
            .values({ articleId: id, isRead, isStarred, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: articleState.articleId,
                set: { isRead, isStarred, updatedAt: new Date() }
            });
    }

    return json([]); // empty array = no conflicts, everything accepted
};