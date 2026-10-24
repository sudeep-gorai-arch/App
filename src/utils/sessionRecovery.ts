/** Preserve a locally cached login only when the server has not rejected it. */
export const shouldKeepCachedSession = (error: unknown): boolean => {
  const status = (error as { status?: number } | null)?.status;
  // A verified 401 means the token is invalid or revoked, not merely offline.
  return status !== 401;
};
