/** A mutation succeeds only when the server accepts it. Keep server rejection text usable by forms. */
export async function writeRequest(url: string, options: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.error === 'string' ? body.error : 'Unable to save changes. Please try again.');
  }
  return response;
}
