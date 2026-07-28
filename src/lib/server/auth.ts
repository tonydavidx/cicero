import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

const secret = new TextEncoder().encode(env.AUTH_SECRET);
const COOKIE_NAME = 'cicero_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

export async function createSessionToken() {
    return await new SignJWT({ sub: 'owner' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE_SECONDS}s`)
        .sign(secret);
}

export async function verifySessionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };