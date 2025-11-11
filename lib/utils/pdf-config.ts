import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
// Using CDN for simplicity in POC. For production, consider bundling the worker.
// Only configure in browser environment (not during SSR)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}
