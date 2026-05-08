import fs from 'fs';
import path from 'path';

export const saveFile = (
  data: string,
  filename: string,
  outputDirectory: string,
  silent?: boolean,
): void => {
  try {
    const outputPath = path.join(process.cwd(), outputDirectory);
    const filePath = path.join(outputPath, filename);
    fs.mkdirSync(outputPath, { recursive: true });
    fs.writeFileSync(filePath, data);
    if (!silent) {
      console.log(`File "${filename}" successfully saved to ${filePath}.`);
    }
  } catch (error) {
    console.error(`Error saving file "${filename}".`, error);
  }
};
