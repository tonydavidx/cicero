import { redirect } from '@sveltejs/kit';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  if (url.pathname === '/login') return;

  const token = cookies.get(COOKIE_NAME);
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    throw redirect(302, '/login');
  }
};
