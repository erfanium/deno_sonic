const textEscapePatterns: [RegExp, string][] = [
  [/\\/g, "\\\\"],
  [/\n/g, "\\n"],
  [/"/g, '\\"'],
];

export function quoted(text: string): string {
  text = text || "";

  for (let i = 0; i < textEscapePatterns.length; i++) {
    const pattern = textEscapePatterns[i];
    text = text.replace(pattern[0], pattern[1]);
  }

  return '"' + text + '"';
}

export function format(
  command: string,
  args: (string | undefined)[],
  options?: Record<string, string | undefined>,
): string {
  let result = command + " " + args.join(" ").trim();
  if (!options) return result;

  for (const key in options) {
    const value = options[key];
    if (value == undefined) continue;
    result += " " + key.toUpperCase() + "(" + options[key] + ")";
  }

  return result;
}
