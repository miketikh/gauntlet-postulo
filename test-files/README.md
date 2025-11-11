# Test Files for Document Extraction

This directory contains sample files for testing Word document and image OCR extraction.

## Test Files Needed

To test the extraction functionality, create or add the following files:

### 1. Word Document (.docx)
**File:** `sample.docx`
- A simple Word document with text content
- Test extraction with: `extractWordText(s3Key)`
- Expected: Clean text extraction, single page count

### 2. Clear Image (JPEG)
**File:** `sample-clear-text.jpg`
- A high-quality image with clear, printed text
- Test extraction with: `extractImageText(s3Key)`
- Expected: High OCR confidence (>80%), accurate text

### 3. Poor Quality Image (JPEG)
**File:** `sample-poor-quality.jpg`
- A low-quality, blurry, or distorted image
- Test extraction with: `extractImageText(s3Key)`
- Expected: Low OCR confidence (<80%), warning displayed

### 4. PNG Image
**File:** `sample-screenshot.png`
- A screenshot or PNG image with text
- Test extraction with: `extractImageText(s3Key)`
- Expected: OCR extraction with confidence score

## Testing Instructions

### Manual API Testing

1. **Upload Word Document:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample.docx" \
  -F "projectId=YOUR_PROJECT_ID"
```

2. **Upload Image:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample-clear-text.jpg" \
  -F "projectId=YOUR_PROJECT_ID"
```

3. **Check Extraction Status:**
```bash
curl http://localhost:3000/api/documents/DOCUMENT_ID/extraction \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Response (Image with OCR):
```json
{
  "status": "completed",
  "preview": "Extracted text preview...",
  "fullTextLength": 1234,
  "ocrConfidence": 92.5
}
```

### Expected Response (Low Confidence):
```json
{
  "status": "completed",
  "preview": "Poorly extracted text...",
  "fullTextLength": 567,
  "ocrConfidence": 65.2
}
```

## Unit Tests

Run the extraction tests:
```bash
pnpm test lib/services/__tests__/extraction-word-ocr.test.ts
```

## Creating Sample Files

### Create a Simple Word Document:
1. Open Microsoft Word or Google Docs
2. Add some text: "This is a test document for Word extraction."
3. Save as `sample.docx` in this directory

### Create a Clear Text Image:
1. Take a screenshot of text or use a document scanner app
2. Ensure the text is clear and legible
3. Save as `sample-clear-text.jpg`

### Create a Poor Quality Image:
1. Take a photo of text at an angle or in poor lighting
2. Optionally apply blur in an image editor
3. Save as `sample-poor-quality.jpg`

## Performance Notes

- **Word extraction:** Fast (<1 second)
- **PDF extraction:** Moderate (1-10 seconds depending on size)
- **OCR extraction:** Slow (5-10 seconds per image)

OCR is CPU-intensive. For production, consider:
- Queue system for background processing
- Worker pools for parallel processing
- Alternative OCR services (Google Vision API, AWS Textract) for better performance
