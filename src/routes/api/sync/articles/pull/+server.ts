import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const checkpointUpdatedAt = url.searchParams.get('updatedAt') ?? '1970-01-01T00:00:00.000Z';
    const checkpointId = url.searchParams.get('id');
    const limit = Number(url.searchParams.get('limit') ?? 50);

    const whereClause = checkpointId
        ? sql`
			GREATEST(a.updated_at, COALESCE(s.updated_at, a.updated_at)) > ${checkpointUpdatedAt}
			OR (
				GREATEST(a.updated_at, COALESCE(s.updated_at, a.updated_at)) = ${checkpointUpdatedAt}
				AND a.id > ${checkpointId}::uuid
			)
		`
        : sql`GREATEST(a.updated_at, COALESCE(s.updated_at, a.updated_at)) >= ${checkpointUpdatedAt}`;

    const result = await db.execute(sql`
		SELECT
			a.id, a.feed_id, a.guid, a.url, a.title, a.author, a.published_at,
			a.content_raw, a.content_full, a.content_status, a.excerpt, a._deleted,
			COALESCE(s.is_read, false) AS is_read,
			COALESCE(s.is_starred, false) AS is_starred,
			GREATEST(a.updated_at, COALESCE(s.updated_at, a.updated_at)) AS effective_updated_at
		FROM articles a
		LEFT JOIN article_state s ON s.article_id = a.id
		WHERE ${whereClause}
		ORDER BY effective_updated_at ASC, a.id ASC
		LIMIT ${limit}
	`);

    const rows = result.rows as Array<Record<string, unknown>>;

    const documents = rows.map((r) => ({
        id: r.id as string,
        feedId: r.feed_id as string,
        guid: r.guid as string,
        url: r.url as string,
        title: r.title as string,
        author: r.author as string | null,
        publishedAt: r.published_at ? new Date(r.published_at as string).toISOString() : null,
        contentRaw: r.content_raw as string | null,
        contentFull: r.content_full as string | null,
        contentStatus: r.content_status as 'unfetched' | 'fetched' | 'failed',
        excerpt: r.excerpt as string | null,
        isRead: r.is_read as boolean,
        isStarred: r.is_starred as boolean,
        updatedAt: new Date(r.effective_updated_at as string).toISOString(),
        _deleted: r._deleted as boolean
    }));

    const last = documents[documents.length - 1];
    const checkpoint = last
        ? { id: last.id, updatedAt: last.updatedAt }
        : { id: checkpointId ?? null, updatedAt: checkpointUpdatedAt };

    return json({ documents, checkpoint });
};