/// <reference types="vite/client" />
import { NextRequest } from 'next/server';
const routes = Object.entries(import.meta.glob('../../src/app/api/**/route.ts')).sort(([a], [b]) => (a.match(/\[/g)?.length || 0) - (b.match(/\[/g)?.length || 0));
type Context = { params: Promise<Record<string, string>> };
type Handler = (request: NextRequest, context: Context) => Promise<Response> | Response;
export async function requestApi(url: string, method = 'GET', body?: unknown): Promise<Response> {
  const address = new URL(url, 'http://localhost');
  for (const [file, load] of routes) {
    const pattern = file.replace('../../src/app', '').replace('/route.ts', '');
    const names = [...pattern.matchAll(/\[([^\]]+)\]/g)].map(match => match[1]);
    const match = address.pathname.match(new RegExp(`^${pattern.replace(/\[[^\]]+\]/g, '([^/]+)')}$`));
    if (!match) continue;
    const handlers = await load() as Record<string, Handler>;
    if (!handlers[method]) return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const params = Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
    return handlers[method](new NextRequest(address, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }) }), { params: Promise.resolve(params) });
  }
  throw new Error(`No test API route for ${address.pathname}`);
}
