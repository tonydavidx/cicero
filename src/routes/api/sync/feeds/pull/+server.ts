import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { feeds } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const checkpointUpdatedAt = url.searchParams.get('updatedAt') ?? '1970-01-01T00:00:00.000Z';
    const checkpointId = url.searchParams.get('id');
    const limit = Number(url.searchParams.get('limit') ?? 50);

    const whereClause = checkpointId
        ? sql`(${feeds.updatedAt} > ${checkpointUpdatedAt}) OR (${feeds.updatedAt} = ${checkpointUpdatedAt} AND ${feeds.id} > ${checkpointId}::uuid)`
        : sql`${feeds.updatedAt} >= ${checkpointUpdatedAt}`;

    const rows = await db.select().from(feeds).where(whereClause).orderBy(feeds.updatedAt, feeds.id).limit(limit);

    const documents = rows.map((r) => ({
        id: r.id,
        url: r.url,
        title: r.title,
        faviconUrl: r.faviconUrl,
        updatedAt: r.updatedAt.toISOString(),
        _deleted: r._deleted
    }));

    const lastRow = rows[rows.length - 1];
    const checkpoint = lastRow
        ? { id: lastRow.id, updatedAt: lastRow.updatedAt.toISOString() }
        : { id: checkpointId, updatedAt: checkpointUpdatedAt };

    return json({ documents, checkpoint });
};