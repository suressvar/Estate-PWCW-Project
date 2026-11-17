import { describe, expect, it } from 'vitest';
import { readLimitedBody, RequestSizeError } from '../src/lib/request-body';
describe('bounded request body reader', () => {
  it('returns an empty string for a bodyless request', async () => expect(await readLimitedBody(new Request('http://localhost'), 10)).toBe(''));
  it('reads UTF-8 based on byte limits', async () => {
    expect(await readLimitedBody(new Request('http://localhost', { method: 'POST', body: '₹' }), 3)).toBe('₹');
    await expect(readLimitedBody(new Request('http://localhost', { method: 'POST', body: '₹' }), 2)).rejects.toBeInstanceOf(RequestSizeError);
  });
  it('rejects an excessive declared size before reading', async () => {
    await expect(readLimitedBody(new Request('http://localhost', { method: 'POST', headers: { 'Content-Length': '1000' }, body: 'A' }), 10)).rejects.toBeInstanceOf(RequestSizeError);
  });
  it('cancels a chunked stream as soon as actual bytes exceed the limit', async () => {
    let canceled = false;
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(6)); controller.enqueue(new Uint8Array(6)); }, cancel() { canceled = true; } });
    const request = new Request('http://localhost', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    await expect(readLimitedBody(request, 10)).rejects.toBeInstanceOf(RequestSizeError);
    expect(canceled).toBe(true);
  });
  it('propagates a broken stream instead of interpreting partial input as valid', async () => {
    const stream = new ReadableStream({ start(controller) { controller.error(new Error('Connection lost')); } });
    const request = new Request('http://localhost', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    await expect(readLimitedBody(request, 10)).rejects.toThrow('Connection lost');
  });
});
