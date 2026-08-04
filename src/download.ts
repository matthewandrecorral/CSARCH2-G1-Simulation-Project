/** Trigger a browser download for in-memory text content (CSV, JSON, etc.). */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Escape one CSV field, quoting only when it contains a comma, quote, or newline. */
export function toCsvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Join header + rows into a single CSV document with CRLF line endings. */
export function buildCsv(header: readonly string[], rows: ReadonlyArray<readonly (string | number)[]>): string {
  const lines = [header, ...rows].map((row) => row.map(toCsvField).join(","));
  return lines.join("\r\n");
}
