import { lookup } from 'node:dns/promises';
import { isIPv4 } from 'node:net';

export class SsrfError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'SsrfError';
  }
}

function isPrivateIP(ip: string): boolean {
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
  if (ip.startsWith('fe80')) return true;

  if (!isIPv4(ip)) return false;

  const parts = ip.split('.').map(Number);
  const a = parts[0];

  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && parts[1] === 254) return true;
  if (a === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (a === 192 && parts[1] === 168) return true;
  if (a === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  if (a === 198 && parts[1] >= 18 && parts[1] <= 19) return true;

  return false;
}

export async function safeFetch(url: string, init?: RequestInit, timeoutMs = 30_000): Promise<Response> {
  const parsed = new URL(url);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError(`Protocol "${parsed.protocol}" is not allowed`);
  }

  const hostname = parsed.hostname;
  let addresses: string[];

  if (isIPv4(hostname)) {
    addresses = [hostname];
  } else if (hostname.startsWith('[') || hostname.includes(':')) {
    addresses = [hostname.replace(/^\[|\]$/g, '')];
  } else {
    const result = await lookup(hostname, { all: true });
    addresses = result.map((a) => a.address);
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      throw new SsrfError(`Request to private IP (${addr}) is blocked`);
    }
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}
