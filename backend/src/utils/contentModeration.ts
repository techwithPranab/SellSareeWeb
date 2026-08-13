const BLOCKED_TERMS = [
  // Sexual content
  'porn', 'porno', 'pornography', 'nude', 'nudes', 'nudity', 'sex', 'sexual',
  'sexy', 'xxx', 'boob', 'boobs', 'breast', 'penis', 'vagina', 'dick', 'cock',
  // Profanity, abuse, and hateful/offensive language
  'fuck', 'fucking', 'fucker', 'shit', 'bullshit', 'bitch', 'bastard', 'asshole',
  'motherfucker', 'slut', 'whore', 'retard', 'chutiya', 'madarchod', 'bhenchod',
  'behenchod', 'randi', 'harami',
];

const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's',
};

function normalizeForModeration(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[013457@$]/g, (character) => LEET_MAP[character] || character)
    .replace(/(.)\1{2,}/g, '$1$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function containsBlockedReviewContent(...values: string[]): boolean {
  const normalized = normalizeForModeration(values.join(' '));
  return BLOCKED_TERMS.some((term) => {
    const separatedLetters = term.split('').join('[^a-z0-9]*');
    return new RegExp(`(^|[^a-z0-9])${separatedLetters}([^a-z0-9]|$)`, 'i').test(normalized);
  });
}
