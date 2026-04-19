"use client";

// Set up PDF.js worker BEFORE any other code tries to use it
if (typeof window !== "undefined") {
  (window as any).PDFJS_WORKER_SRC = "/pdf.worker.min.mjs";
}

// Dynamically import PDF.js to avoid DOM errors on server
const getPdfLibrary = async () => {
  const { createWorker } = await import("tesseract.js");
  const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
  
  if (typeof window !== "undefined") {
    // Use local worker file from public folder
    GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  return { createWorker, GlobalWorkerOptions, getDocument };
};

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create image blob from PDF page."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });

const renderPageToCanvas = async (pdf: any, pageNumber: number) => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create canvas context for OCR.");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
};

export const extractTextFromPdf = async (file: File) => {
  const { createWorker, getDocument } = await getPdfLibrary();
  
  const fileBuffer = await file.arrayBuffer();

  const pdf = await getDocument({
    data: new Uint8Array(fileBuffer),
  }).promise;

  const worker = await createWorker("eng");
  const allText: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const canvas = await renderPageToCanvas(pdf, pageNumber);
      const imageBlob = await canvasToBlob(canvas);
      const {
        data: { text },
      } = await worker.recognize(imageBlob);

      if (text?.trim()) {
        allText.push(text.trim());
      }
    }
  } finally {
    await worker.terminate();
  }

  return allText.join("\n\n");
};
