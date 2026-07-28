import { json, error } from '@sveltejs/kit';
import { fetchFullArticle } from '$lib/server/articles';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
    const result = await fetchFullArticle(params.id);

    if (result.status === 'not-found') {
        throw error(404, 'Article not found');
    }
    if (result.status === 'failed') {
        return json({ status: 'failed' }, { status: 502 });
    }

    return json({ status: 'fetched', content: result.content });
};