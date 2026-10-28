/** Noktalı virgülle ayrılmış CSV (Türkçe Excel varsayılanı), RFC 4180 tırnaklama ile. */
import { readFileSync, writeFileSync } from 'node:fs';

const SEP = ';';

export type Row = Record<string, string | number>;

function quote(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function writeCsv(path: string, rows: Row[]): void {
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(SEP), ...rows.map((r) => headers.map((h) => quote(r[h] ?? '')).join(SEP))];
  // BOM: Excel'in UTF-8 Türkçe karakterleri doğru açması için
  writeFileSync(path, '﻿' + lines.join('\n') + '\n');
}

export function readCsv(path: string): Record<string, string>[] {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const firstLine = text.split('\n', 1)[0];
  const sep = firstLine.includes(SEP) ? SEP : ',';
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      if (record.some((f) => f !== '')) records.push(record);
      record = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || record.length) {
    record.push(field);
    records.push(record);
  }

  const [headers, ...rows] = records;
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
