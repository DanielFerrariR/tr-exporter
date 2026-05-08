import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { EnrichedTransaction } from '@/domain/models';

const PDFS_DIRECTORY = 'pdfs';

const OUTPUT_DIRECTORY = 'build';

// Matches any DD.MM.YYYY date in PDF text
const ALL_DATES_RE = /(\d{2})\.(\d{2})\.(\d{4})/g;
// Matches "Ex-Tag am DD.MM.YYYY" (newer TR correction format)
const EX_TAG_RE = /Ex-Tag am (\d{2})\.(\d{2})\.(\d{4})/;
// Matches "Zahlungstermin am DD.MM.YYYY" (older TR correction format — direct payment date)
const ZAHLUNGSTERMIN_RE = /Zahlungstermin am (\d{2})\.(\d{2})\.(\d{4})/;

function fromGerman(d: string, m: string, y: string): Date {
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function isinFromIcon(icon: string): string {
  return icon.split('/')[1] ?? '';
}

async function readPdfText(filePath: string): Promise<string> {
  try {
    const parser = new PDFParse({ url: filePath });
    const { text } = await parser.getText();
    return text;
  } catch {
    return '';
  }
}

interface CorrectionResult {
  isin: string;
  exDate: Date | null;
  paymentDate: Date | null;
}

async function resolveCorrectionDates(
  transactionId: string,
  batchYear: number,
  pdfsDir: string,
): Promise<CorrectionResult> {
  let exDate: Date | null = null;
  const preBatchDates: Date[] = [];

  let idx = 0;
  while (true) {
    const filePath = path.join(pdfsDir, `${transactionId}_${idx}.pdf`);
    if (!fs.existsSync(filePath)) break;

    const text = await readPdfText(filePath);

    if (idx === 0) {
      // "Zahlungstermin am" is the direct payment date — use immediately, no further scanning needed
      const zMatch = ZAHLUNGSTERMIN_RE.exec(text);
      if (zMatch) {
        const d = fromGerman(zMatch[1], zMatch[2], zMatch[3]);
        return { isin: '', exDate: d, paymentDate: d };
      }
      // "Ex-Tag am" is the ex-dividend date
      const eMatch = EX_TAG_RE.exec(text);
      if (eMatch) exDate = fromGerman(eMatch[1], eMatch[2], eMatch[3]);
    }

    // Collect every DD.MM.YYYY before the batch year (filters out batch-processing dates)
    ALL_DATES_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ALL_DATES_RE.exec(text)) !== null) {
      if (parseInt(m[3]) < batchYear) {
        preBatchDates.push(fromGerman(m[1], m[2], m[3]));
      }
    }

    idx++;
  }

  // Most-recent pre-batch date is the original payment date (from companion PDFs or _0.pdf itself)
  preBatchDates.sort((a, b) => b.getTime() - a.getTime());
  const mostRecent = preBatchDates[0] ?? null;

  // If mostRecent is just the ex-date with no better date from companion PDFs,
  // mark paymentDate as null so the sibling fallback can fill it in.
  const paymentDate =
    mostRecent && exDate && mostRecent.getTime() === exDate.getTime()
      ? null
      : mostRecent;

  return { isin: '', exDate, paymentDate };
}

export const restampCorrectedDividends = async (
  transactions: EnrichedTransaction[],
  phoneNumber: string,
): Promise<EnrichedTransaction[]> => {
  const pdfsDir = path.join(OUTPUT_DIRECTORY, phoneNumber, PDFS_DIRECTORY);

  const corrections = transactions.filter(
    (t) => t.subtitle === 'Cash dividend corrected',
  );
  if (corrections.length === 0) return transactions;

  console.log(
    `Restamping ${corrections.length} "Cash dividend corrected" transaction(s) from PDF receipts...`,
  );

  // Step 1: resolve dates for every correction
  const resultMap = new Map<string, CorrectionResult>();
  for (const t of corrections) {
    const batchYear = new Date(t.timestamp).getFullYear();
    const result = await resolveCorrectionDates(t.id, batchYear, pdfsDir);
    result.isin = isinFromIcon(t.icon);
    resultMap.set(t.id, result);
  }

  // Step 2: sibling fallback — if a correction only found an ex-date (no companion PDF),
  // borrow the payment date from another correction with the same ISIN + ex-date.
  const byExDate = new Map<string, string[]>();
  for (const [tid, r] of resultMap) {
    if (!r.exDate) continue;
    const key = `${r.isin}|${toIsoDate(r.exDate)}`;
    byExDate.set(key, [...(byExDate.get(key) ?? []), tid]);
  }

  for (const siblings of byExDate.values()) {
    const bestSiblingPayment = siblings
      .map((tid) => resultMap.get(tid)!.paymentDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!bestSiblingPayment) continue;

    for (const tid of siblings) {
      const r = resultMap.get(tid)!;
      if (!r.paymentDate) {
        resultMap.set(tid, { ...r, paymentDate: bestSiblingPayment });
      }
    }
  }

  // Step 3: apply corrected timestamps (preserve original if no date found)
  let restamped = 0;
  const result = transactions.map((t) => {
    if (t.subtitle !== 'Cash dividend corrected') return t;
    const r = resultMap.get(t.id);
    const date = r?.paymentDate ?? r?.exDate;
    if (!date) return t;
    restamped++;
    return { ...t, timestamp: `${toIsoDate(date)}T12:00:00.000+0000` };
  });

  console.log(`Restamped ${restamped}/${corrections.length} corrections.`);
  return result;
};
