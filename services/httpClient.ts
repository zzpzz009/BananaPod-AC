import { withRetry } from '@/utils/retry';

const WHATAI_BASE_URL = process.env.WHATAI_BASE_URL || 'https://api.whatai.cc';
const WHATAI_API_KEY = process.env.WHATAI_API_KEY;
const PROXY_VIA_VITE = (process.env.PROXY_VIA_VITE || 'true') === 'true';
const IS_BROWSER = typeof window !== 'undefined';

export function isWhataiEnabled(): boolean {
  return Boolean(WHATAI_API_KEY || PROXY_VIA_VITE);
}

export async function whataiFetch(path: string, init: RequestInit): Promise<Response> {
  const useDevProxy = IS_BROWSER && PROXY_VIA_VITE;
  const proxyUrl = `/proxy-whatai${path}`;
  const directUrl = `${WHATAI_BASE_URL}${path}`;
  const headers = new Headers(init.headers || {});
  const clientKey = IS_BROWSER ? localStorage.getItem('WHATAI_API_KEY') || '' : '';
  if (clientKey) headers.set('Authorization', `Bearer ${clientKey}`);
  else if (!useDevProxy && WHATAI_API_KEY) headers.set('Authorization', `Bearer ${WHATAI_API_KEY}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const finalInit: RequestInit = { ...init, headers };
  let resp: Response | null = null;
  let firstError: unknown = null;
  const primaryUrl = useDevProxy ? proxyUrl : directUrl;
  try {
    resp = await withRetry(() => fetch(primaryUrl, finalInit), { retries: 3, baseDelayMs: 800 });
    if (useDevProxy && (!resp.ok && resp.status === 404)) { resp = null; throw new Error('proxy 404'); }
  } catch (err) { firstError = err; }
  if (!resp) {
    try { resp = await withRetry(() => fetch(directUrl, finalInit), { retries: 3, baseDelayMs: 800 }); }
    catch (err2) { const e = firstError || err2; throw e instanceof Error ? e : new Error(String(e)); }
  }
  if (!resp.ok) { const text = await resp.text().catch(() => ''); throw new Error(`whatai API Error: ${resp.status} ${resp.statusText} ${text}`); }
  return resp;
}