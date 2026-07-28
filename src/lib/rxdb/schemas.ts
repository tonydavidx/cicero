export const articleSchema: RxJsonSchema<ArticleDoc> = {
    title: 'article schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 36 },
        feedId: { type: 'string', maxLength: 36 },
        guid: { type: 'string' },
        url: { type: 'string' },
        title: { type: 'string' },
        author: { type: ['string', 'null'] },
        publishedAt: { type: ['string', 'null'] },
        contentRaw: { type: ['string', 'null'] },
        contentFull: { type: ['string', 'null'] },
        contentStatus: { type: 'string', enum: ['unfetched', 'fetched', 'failed'] },
        excerpt: { type: ['string', 'null'] },
        isRead: { type: 'boolean' },
        isStarred: { type: 'boolean' },
        updatedAt: { type: 'string', maxLength: 30 },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'feedId', 'guid', 'url', 'title', 'updatedAt', '_deleted'],
    indexes: ['updatedAt', 'feedId']
};

export const feedSchema: RxJsonSchema<FeedDoc> = {
    title: 'feed schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 36 },
        url: { type: 'string' },
        title: { type: ['string', 'null'] },
        faviconUrl: { type: ['string', 'null'] },
        updatedAt: { type: 'string', maxLength: 30 },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'url', 'updatedAt', '_deleted'],
    indexes: ['updatedAt']
};