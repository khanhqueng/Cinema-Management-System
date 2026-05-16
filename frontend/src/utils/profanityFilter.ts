/**
 * Profanity filter for Vietnamese and English text.
 *
 * Handles bypass tricks:
 *  - Repeated chars:     e.g. "ngu" with extra letters  (pattern uses + per char)
 *  - Wrong/no diacritics: di, moe -> dit, me  (strip 1:1 via NFD)
 *  - Chars inserted:     l.o.n, l*n -> lon  ([^a-z0-9]* between chars)
 *  - Leet speak:         @ss, b!tch, sh1t  (@->a, 1->i, ...)
 *  - Abbreviations:      dm, vcl, vkl  (explicit entries)
 *  - Mid-word masking:   f**k, s**t, di*  (SPECIAL_PATTERNS)
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SEP = '[^a-z0-9]*'; // optional separator between chars
const WB_S = '(?<![a-z0-9])'; // word-start: no letter/digit before
const WB_E = '(?![a-z0-9])';  // word-end:   no letter/digit after

function buildPattern(word: string): RegExp {
  const parts: string[] = [];
  for (const ch of word) {
    if (ch === ' ') parts.push('[^a-z0-9]+'); // multi-word gap
    else parts.push(`${escRe(ch)}+`);          // allow repeated char
  }
  return new RegExp(`${WB_S}${parts.join(SEP)}${WB_E}`, 'gi');
}

/**
 * 1:1 normalization — output length equals input length for Vietnamese NFC text.
 * Does NOT collapse repeated chars; patterns handle that via `+`.
 */
function normalizeMap(text: string): string {
  let s = text.replace(/[đĐ]/g, 'd'); // handle d-stroke before NFD
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); // strip combining marks
  s = s.toLowerCase();
  s = s
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/4/g, 'a');
  return s;
}

// ── Banned word list (pre-normalized: no diacritics, lowercase) ───────────────

const BANNED_WORDS: string[] = [
  // Vietnamese vulgar words
  'dit', 'dich', 'djt', 'dja',
  'lon',
  'buoi',
  'cac', 'kac',
  'du ma', 'duma', 'du me', 'du may', 'du ba',
  'deo co', 'deo',
  'me may', 'me m', 'me no',
  'moe may', 'moe m',
  // Common abbreviations
  'dm', 'dmm', 'dmmm',
  'vcl', 'vcc', 'vkl', 'vkc',
  'clm', 'clmm',
  // Insults
  'ngu',                          // word boundary keeps "nguyen" safe
  'cave',
  'cho chet', 'di chet', 'chet di',
  'con cho', 'con di', 'con heo',
  'that vat',
  // English
  'fuck', 'fuk', 'fck',
  'shit', 'sht',
  'bitch', 'btch',
  'asshole',
  'bastard',
  'cunt', 'cock', 'dick',
  'motherfucker',
  'idiot', 'moron', 'retard',
  'whore', 'slut',
  'stfu',
];

// Special patterns for mid-word masking tricks (run on normalizeMap output)
const SPECIAL_PATTERNS: RegExp[] = [
  new RegExp(`${WB_S}f[^a-z0-9]+k${WB_E}`, 'gi'),                            // f**k
  new RegExp(`${WB_S}sh?[^a-z0-9]*[i1]?[^a-z0-9]*t${WB_E}`, 'gi'),          // s**t, sh*t
  new RegExp(`${WB_S}b[^a-z0-9]*[i1!]?[^a-z0-9]*t?[^a-z0-9]*ch${WB_E}`, 'gi'), // b**ch
  new RegExp(`${WB_S}d[^a-z0-9]*[i1!][^a-z]*\\*+${WB_E}`, 'gi'),             // di* (hidden suffix)
];

// Whitelist — valid words that contain banned substrings (applied on normalizeMap output)
const WHITELIST: RegExp[] = [
  /\bnguyen\b/gi,
  /\bnguoi\b/gi,
  /\bnguon\b/gi,
  /\blong\b/gi,
  /\bde\b/gi,
  /\bdi\s+(ve|vao|ra|toi|qua|len|xuong|choi|hoc|lam|an|sang|dau)\b/gi,
  /\bdick\s+[a-z]+\b/gi,
];

const ALL_PATTERNS = [...BANNED_WORDS.map(buildPattern), ...SPECIAL_PATTERNS];

// ── Public API ─────────────────────────────────────────────────────────────────

/** Returns true if the text contains any banned word. */
export function hasProfanity(text: string): boolean {
  if (!text?.trim()) return false;
  const norm = normalizeMap(text);
  return ALL_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(norm);
  });
}

/**
 * Replace banned words in text with ***.
 * Preserves original casing and non-banned characters.
 */
export function filterText(text: string): string {
  if (!text?.trim()) return text;

  // normalizeMap preserves string length (1:1 per char), so indices are shared
  const norm = normalizeMap(text);
  const masked = new Uint8Array(text.length);

  for (const pattern of ALL_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(norm)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;

      const segment = norm.slice(start, end);
      const whitelisted = WHITELIST.some((wl) => {
        wl.lastIndex = 0;
        return wl.test(segment);
      });
      if (whitelisted) continue;

      for (let i = start; i < end; i++) masked[i] = 1;
    }
  }

  // Collapse consecutive masked chars into a single ***
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (masked[i]) {
      result += '***';
      while (i < text.length && masked[i]) i++;
    } else {
      result += text[i];
      i++;
    }
  }

  return result;
}
