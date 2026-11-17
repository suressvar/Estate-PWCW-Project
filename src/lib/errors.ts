export function errorMessage(error: unknown, fallback = 'The request could not be completed.'): string {
  return error instanceof Error ? error.message : fallback;
}
