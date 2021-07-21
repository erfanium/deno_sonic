export function chunkString(str: string, maxBytes: number): string[] {
  const maxLength = Math.floor(maxBytes / 8);
  if (str.length <= maxLength) return [str];
  const groups: string[] = [];

  while (str) {
    groups.push(str.substring(0, maxLength));

    // Assign next content chunk (we may not be done)
    str = str.substring(maxLength);
  }

  return groups;
}
