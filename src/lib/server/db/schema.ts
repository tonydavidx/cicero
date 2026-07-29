import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const feeds = pgTable(
	'feeds',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		url: text('url').notNull(),
		title: text('title'),
		faviconUrl: text('favicon_url'),
		lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
		etag: text('etag'),
		lastModified: text('last_modified'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		_deleted: boolean('_deleted').notNull().default(false)
	},
	(t) => [uniqueIndex('feeds_url_idx').on(t.url), index('feeds_updated_at_idx').on(t.updatedAt)]
);

export const articles = pgTable(
	'articles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		feedId: uuid('feed_id')
			.notNull()
			.references(() => feeds.id, { onDelete: 'cascade' }),
		guid: text('guid').notNull(),
		url: text('url').notNull(),
		title: text('title'),
		author: text('author'),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		contentRaw: text('content_raw'),
		contentFull: text('content_full'),
		contentStatus: text('content_status', { enum: ['unfetched', 'fetched', 'failed'] })
			.notNull()
			.default('unfetched'),
    excerpt: text('excerpt'),
    imageUrl: text('image_url'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		_deleted: boolean('_deleted').notNull().default(false)
	},
	(t) => [
		uniqueIndex('articles_feed_guid_idx').on(t.feedId, t.guid),
		index('articles_updated_at_idx').on(t.updatedAt),
		index('articles_published_at_idx').on(t.publishedAt)
	]
);

export const articleState = pgTable(
	'article_state',
	{
		articleId: uuid('article_id')
			.primaryKey()
			.references(() => articles.id, { onDelete: 'cascade' }),
		isRead: boolean('is_read').notNull().default(false),
		isStarred: boolean('is_starred').notNull().default(false),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('article_state_updated_at_idx').on(t.updatedAt)]
);