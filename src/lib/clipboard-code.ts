/** Never turn unrelated clipboard text into a conference code. */
export function clipboardConferenceCode(text: string): string | null {
  const code = text.trim();
  return /^[A-Za-z0-9]{32}$/.test(code) ? code : null;
}