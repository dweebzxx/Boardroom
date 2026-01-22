import 'server-only';

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface PdfPageImage {
  pageNumber: number;
  filePath: string;
}

const execFileAsync = (command: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const hasBinary = async (binary: string) => {
  try {
    await execFileAsync('which', [binary]);
    return true;
  } catch {
    return false;
  }
};

export const pdfToImages = async (pdfBytes: Uint8Array): Promise<PdfPageImage[]> => {
  const hasPdftoppm = await hasBinary('pdftoppm');
  if (!hasPdftoppm) {
    return [];
  }

  const workDir = await fs.mkdtemp(join(tmpdir(), 'boardroom-pdf-'));
  const pdfPath = join(workDir, 'document.pdf');
  const outputPrefix = join(workDir, 'page');

  await fs.writeFile(pdfPath, pdfBytes);
  await execFileAsync('pdftoppm', ['-png', pdfPath, outputPrefix]);

  const files = await fs.readdir(workDir);
  const pageFiles = files
    .filter((file) => file.startsWith('page-') && file.endsWith('.png'))
    .map((file) => ({
      file,
      pageNumber: Number(file.replace('page-', '').replace('.png', '')),
    }))
    .filter((entry) => Number.isFinite(entry.pageNumber))
    .sort((a, b) => a.pageNumber - b.pageNumber);

  return pageFiles.map((entry) => ({
    pageNumber: entry.pageNumber,
    filePath: join(workDir, entry.file),
  }));
};
