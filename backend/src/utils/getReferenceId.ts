/**
 * Returns an ID string from either a raw Mongoose ObjectId or a populated
 * document. Populated documents stringify to their full object representation,
 * so their `_id` must be selected explicitly.
 */
export const getReferenceId = (reference: unknown): string => {
  if (reference && typeof reference === 'object') {
    const populated = reference as { _id?: unknown; id?: unknown };
    return String(populated._id ?? populated.id ?? reference);
  }

  return String(reference);
};
