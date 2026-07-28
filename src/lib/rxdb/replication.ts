import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import { getDb } from './index';
import type { ArticleDoc, FeedDoc } from './schemas';

type Checkpoint = { id: string | null; updatedAt: string };

async function authedFetch(url: string, init?: RequestInit) {
    const res = await fetch(url, { ...init, credentials: 'include' });
    if (res.status === 401) {
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        throw new Error('Unauthorized');
    }
    return res;
}

export async function startReplication() {
    const db = await getDb();

    const feedsReplication = replicateRxCollection<FeedDoc, Checkpoint>({
        collection: db.feeds,
        replicationIdentifier: 'feeds-replication',
        live: true,
        retryTime: 5000,
        pull: {
            handler: async (checkpoint, batchSize) => {
                const params = new URLSearchParams({ limit: String(batchSize) });
                if (checkpoint) {
                    params.set('id', checkpoint.id ?? '');
                    params.set('updatedAt', checkpoint.updatedAt);
                }
                const res = await authedFetch(`/api/sync/feeds/pull?${params}`);
                const { documents, checkpoint: newCheckpoint } = await res.json();
                return { documents, checkpoint: newCheckpoint };
            }
            // no push — feeds are managed via their own CRUD endpoint, not synced up
        }
    });

    const articlesReplication = replicateRxCollection<ArticleDoc, Checkpoint>({
        collection: db.articles,
        replicationIdentifier: 'articles-replication',
        live: true,
        retryTime: 5000,
        pull: {
            handler: async (checkpoint, batchSize) => {
                const params = new URLSearchParams({ limit: String(batchSize) });
                if (checkpoint) {
                    params.set('id', checkpoint.id ?? '');
                    params.set('updatedAt', checkpoint.updatedAt);
                }
                const res = await authedFetch(`/api/sync/articles/pull?${params}`);
                const { documents, checkpoint: newCheckpoint } = await res.json();
                return { documents, checkpoint: newCheckpoint };
            }
        },
        push: {
            handler: async (rows) => {
                const res = await authedFetch('/api/sync/articles/push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rows)
                });
                return await res.json(); // array of conflicting docs, empty = all accepted
            }
        }
    });

    feedsReplication.error$.subscribe((err) => console.error('feeds replication error', err));
    articlesReplication.error$.subscribe((err) => console.error('articles replication error', err));

    return { feedsReplication, articlesReplication };
}

export type Replications = Awaited<ReturnType<typeof startReplication>>;