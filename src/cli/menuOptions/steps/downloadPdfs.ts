import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cliProgress from 'cli-progress';
import { TransactionDocumentsSection } from '@/tr';
import { EnrichedTransaction } from '@/models';

const OUTPUT_DIRECTORY = 'build';
const PDFS_DIRECTORY = 'pdfs';

interface PdfDownloadTask {
  filename: string;
  url: string;
}

export const downloadPdfs =
  (phoneNumber: string) =>
  async (txs: EnrichedTransaction[]): Promise<EnrichedTransaction[]> => {
    const pdfsDir = path.join(OUTPUT_DIRECTORY, phoneNumber, PDFS_DIRECTORY);
    fs.mkdirSync(pdfsDir, { recursive: true });

    const tasks: PdfDownloadTask[] = [];

    for (const transaction of txs) {
      const docsSection = transaction.sections?.find(
        (s): s is TransactionDocumentsSection => s.type === 'documents',
      );
      if (!docsSection) continue;

      docsSection.data.forEach((doc, index) => {
        const url = doc.action?.payload;
        if (typeof url !== 'string' || !url.includes('.pdf')) return;
        tasks.push({ filename: `${transaction.id}_${index}.pdf`, url });
      });
    }

    if (tasks.length === 0) {
      console.log('No PDF documents found to download.');
      return txs;
    }

    const CONCURRENCY = 10;

    const bar = new cliProgress.SingleBar(
      {
        format: 'Downloading PDFs [{bar}] {percentage}% ({value}/{total})',
        barCompleteChar: '█',
        barIncompleteChar: '░',
      },
      cliProgress.Presets.shades_classic,
    );
    bar.start(tasks.length, 0);

    const errors: string[] = [];

    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      const batch = tasks.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async ({ filename, url }) => {
          const filePath = path.join(pdfsDir, filename);
          if (!fs.existsSync(filePath)) {
            try {
              const response = await axios.get(url, {
                responseType: 'arraybuffer',
              });
              fs.writeFileSync(filePath, Buffer.from(response.data));
            } catch (err) {
              errors.push(
                `Failed to download ${filename}: ${err instanceof Error ? err.message : err}`,
              );
            }
          }
          bar.increment();
        }),
      );
    }

    bar.stop();
    for (const e of errors) {
      console.warn(e);
    }

    return txs;
  };
