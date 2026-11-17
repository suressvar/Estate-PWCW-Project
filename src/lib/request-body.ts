export class RequestSizeError extends Error {}
/** Bound allocation while reading, including requests without a Content-Length. */
export async function readLimitedBody(request: Request, limit: number): Promise<string> {
  const declared = Number(request.headers.get('content-length'));
  if (declared > limit) throw new RequestSizeError('Request is too large.');
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) { void reader.cancel().catch(() => {}); throw new RequestSizeError('Request is too large.'); }
      chunks.push(value);
    }
    return Buffer.concat(chunks, total).toString('utf8');
  } finally { reader.releaseLock(); }
}
