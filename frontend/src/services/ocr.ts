/**
 * OCR service for extracting text from food package images
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  error?: string;
}

let workerInstance: Tesseract.Worker | null = null;

/**
 * Get or create a Tesseract worker instance
 */
async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerInstance) {
    workerInstance = await Tesseract.createWorker();
  }
  return workerInstance;
}

/**
 * Extract text from image URL or file
 */
export async function extractTextFromImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const worker = await getWorker();

    let jobPromise;

    if (typeof imageSource === 'string') {
      // URL-based image
      jobPromise = worker.recognize(imageSource);
    } else {
      // File or Blob
      jobPromise = worker.recognize(imageSource);
    }

    const job = jobPromise;

    // Listen to progress if callback provided
    if (onProgress) {
      job.then(() => {
        onProgress(100);
      });
    }

    const { data } = await job;

    return {
      text: data.text,
      confidence: data.confidence,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OCR error';
    return {
      text: '',
      confidence: 0,
      error: message,
    };
  }
}

/**
 * Extract text from canvas element (for camera capture)
 */
export async function extractTextFromCanvas(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const worker = await getWorker();
    const imageData = canvas.toDataURL('image/jpeg');
    return extractTextFromImage(imageData, onProgress);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Canvas OCR failed';
    return {
      text: '',
      confidence: 0,
      error: message,
    };
  }
}

/**
 * Cleanup Tesseract worker
 */
export async function cleanupOCRWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}

/**
 * Process base64 image string
 */
export async function extractTextFromBase64(
  base64String: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const worker = await getWorker();
    const imageData = `data:image/jpeg;base64,${base64String}`;
    return extractTextFromImage(imageData, onProgress);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Base64 OCR failed';
    return {
      text: '',
      confidence: 0,
      error: message,
    };
  }
}

/**
 * Clean and normalize OCR text (remove extra spaces, fix line breaks, etc.)
 */
export function cleanOCRText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}
