/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

// Exercise every GET handler directly against the isolated empty store.
// Dynamic paths use an absent ID to verify graceful missing-record behavior.
const routes = import.meta.glob('../src/app/api/**/route.ts');
const sources = import.meta.glob('../src/app/api/**/route.ts', { query: '?raw', import: 'default', eager: true });
describe('all API read handlers: empty store and missing references', () => {
  for (const [path, load] of Object.entries(routes)) {
    if (!/export\s+(?:async\s+)?function\s+GET\b/.test(sources[path] as string)) continue;
    it(path.replace('../src/app/api/', ''), async () => {
      const handler = await load() as { GET?: (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response> };
      if (!handler.GET) throw new Error('Discovered GET handler missing');
      const params = { id: 'missing', activityId: 'missing', type: 'feed', v_type: 'feed', s_type: 'crop' };
      const url = path.replace('../src/app', '').replace(/\[([^\]]+)\]/g, (_match, key: string) => params[key as keyof typeof params]).replace('/route.ts', '');
      const result = await handler.GET(new NextRequest(`http://localhost${url}?year=2026&month=11&date=2026-11-15`), { params: Promise.resolve(params) });
      expect([200, 400, 404], `Unexpected response for ${url}: ${await result.clone().text()}`).toContain(result.status);
      expect(result.headers.get('content-type')).toContain('application/json');
    });
  }
});
