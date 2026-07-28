import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { dev } from '$app/environment';
import { articleSchema, feedSchema, type ArticleDoc, type FeedDoc } from './schemas';

if (dev) {
    addRxPlugin(RxDBDevModePlugin);
}

export type CiceroCollections = {
    articles: RxDatabase<{ articles: ArticleDoc; feeds: FeedDoc }>['articles'];
    feeds: RxDatabase<{ articles: ArticleDoc; feeds: FeedDoc }>['feeds'];
};

let dbPromise: ReturnType<typeof createDb> | null = null;

async function createDb() {
    const storage = dev
        ? wrappedValidateAjvStorage({ storage: getRxStorageDexie() })
        : getRxStorageDexie();

    const db = await createRxDatabase({
        name: 'cicero',
        storage,
        ignoreDuplicate: dev
    });

    await db.addCollections({
        articles: { schema: articleSchema },
        feeds: { schema: feedSchema }
    });

    return db;
}

export function getDb() {
    if (!dbPromise) {
        dbPromise = createDb();
    }
    return dbPromise;
}