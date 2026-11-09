const REDIRECT_ORIGIN = "https://cosmara.local";

export function safeLocalRedirect(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;

  let decodedValue = value;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (
      decodedValue.startsWith("//") ||
      decodedValue.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(decodedValue)
    ) {
      return fallback;
    }

    try {
      const resolved = new URL(decodedValue, REDIRECT_ORIGIN);
      if (resolved.origin !== REDIRECT_ORIGIN) return fallback;
    } catch {
      return fallback;
    }

    let nextDecodedValue: string;
    try {
      nextDecodedValue = decodeURIComponent(decodedValue);
    } catch {
      return fallback;
    }
    if (nextDecodedValue === decodedValue) {
      const resolved = new URL(value, REDIRECT_ORIGIN);
      return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    }
    decodedValue = nextDecodedValue;
  }

  return fallback;
}
