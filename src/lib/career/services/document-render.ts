// Document Rendering Service
// Pure-TS PDF, Word (.doc HTML), and TXT export
// No external dependencies

/**
 * PDF Generation - Minimal PDF writer with selectable text
 * Creates ATS-friendly PDF with Helvetica font, proper text encoding
 */

interface PDFDocument {
  pages: PDFPage[];
  info: {
    title: string;
    author: string;
    subject: string;
    creator: string;
    producer: string;
    creationDate: string;
    modDate: string;
  };
}

interface PDFPage {
  width: number;
  height: number;
  content: string; // PDF content stream
  resources: PDFResources;
}

interface PDFResources {
  fonts: Map<string, PDFFont>;
}

interface PDFFont {
  name: string;
  baseFont: string;
  encoding: string;
  widths: number[];
}

// Standard Helvetica widths (approximate)
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 222, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 556,
];

function escapePDFString(str: string): string {
  return str.replace(/[\\()]/g, '\\$&');
}

function textToPDFString(str: string, fontSize: number): string {
  const escaped = escapePDFString(str);
  return `(${escaped}) Tj`;
}

function generatePDFPageContent(
  lines: Array<{ text: string; x: number; y: number; fontSize: number; font: string }>,
  pageWidth: number,
  pageHeight: number
): { content: string; resources: PDFResources } {
  const resources: PDFResources = { fonts: new Map() };
  let content = '';
  
  // Use Helvetica and Helvetica-Bold
  resources.fonts.set('F1', { name: 'F1', baseFont: 'Helvetica', encoding: 'WinAnsiEncoding', widths: HELVETICA_WIDTHS });
  resources.fonts.set('F2', { name: 'F2', baseFont: 'Helvetica-Bold', encoding: 'WinAnsiEncoding', widths: HELVETICA_WIDTHS });

  let currentFont = '';
  for (const line of lines) {
    const fontKey = line.font === 'bold' ? 'F2' : 'F1';
    if (fontKey !== currentFont) {
      content += `/${fontKey} ${line.fontSize} Tf\n`;
      currentFont = fontKey;
    }
    content += `${line.x} ${pageHeight - line.y} Td\n`;
    content += textToPDFString(line.text, line.fontSize) + '\n';
  }

  return { content, resources };
}

function buildPDF(doc: PDFDocument): Uint8Array {
  const objects: Array<{ id: number; data: Uint8Array }> = [];
  let objectId = 1;

  // Helper to add object
  const addObject = (data: Uint8Array) => {
    const id = objectId++;
    objects.push({ id, data });
    return id;
  };

  // Page objects
  const pageIds: number[] = [];
  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const pageObjId = addObject(new TextEncoder().encode(
      `<< /Type /Page /Parent ${0} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${0} 0 R /Resources ${0} 0 R >>`
    ));
    // Will fix references later
    pageIds.push(pageObjId);
  }

  // For simplicity, build a minimal valid PDF
  // This is a simplified PDF generator - in production you'd want a more robust implementation
  const pages = doc.pages.map((page, i) => {
    const contentStream = page.content;
    const contentBytes = new TextEncoder().encode(contentStream);
    return {
      type: 'Page',
      content: contentBytes,
      resources: page.resources,
      mediaBox: [0, 0, page.width, page.height],
    };
  });

  // Build complete PDF using a simpler approach
  return buildSimplePDF(doc);
}

function buildSimplePDF(doc: PDFDocument): Uint8Array {
  const parts: string[] = [];
  const objects: Array<{ data: Uint8Array; offset: number }> = [];

  const addPart = (str: string) => parts.push(str);
  const addObject = (data: Uint8Array) => {
    const offset = parts.join('').length;
    objects.push({ data, offset });
  };

  // Header
  addPart('%PDF-1.4\n');

  // Catalog
  const catalogId = objects.length + 1;
  addPart(`${catalogId} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Pages
  const pagesId = objects.length + 2;
  const pageRefs = doc.pages.map((_, i) => `${pagesId + 1 + i} 0 R`).join(' ');
  addPart(`${pagesId} 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${doc.pages.length} >>\nendobj\n`);

  // Font objects
  const font1Id = objects.length + 3;
  addPart(`${font1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);
  const font2Id = objects.length + 4;
  addPart(`${font2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);

  // Page objects
  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const pageObjId = pagesId + 1 + i;
    const contentId = pageObjId + doc.pages.length;
    const resourcesId = contentId + doc.pages.length;

    // Page
    addPart(`${pageObjId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${contentId} 0 R /Resources ${resourcesId} 0 R >>\nendobj\n`);
  }

  // Content streams
  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const contentId = pagesId + 1 + i + doc.pages.length;
    const contentBytes = new TextEncoder().encode(page.content);
    addPart(`${contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
    // We'll handle binary content differently
  }

  // This is getting complex. Let me use a simpler approach - generate a complete PDF string
  return generateCompletePDF(doc);
}

function generateCompletePDF(doc: PDFDocument): Uint8Array {
  const lines: string[] = [];
  const objOffsets: number[] = [];
  let currentOffset = 0;

  const write = (str: string) => {
    lines.push(str);
    currentOffset += Buffer.byteLength(str, 'utf8');
  };

  const writeObj = (id: number, content: string) => {
    objOffsets[id] = currentOffset;
    write(`${id} 0 obj\n${content}\nendobj\n`);
  };

  // 1. Catalog
  writeObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  // 2. Pages
  const pageRefs = doc.pages.map((_, i) => `${3 + i * 4} 0 R`).join(' ');
  writeObj(2, `<< /Type /Pages /Kids [${pageRefs}] /Count ${doc.pages.length} >>`);

  // Fonts
  writeObj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  writeObj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  // Pages with content and resources
  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const pageId = 3 + i * 4;
    const contentId = pageId + 1;
    const resourcesId = contentId + 1;

    // Page object
    writeObj(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${contentId} 0 R /Resources ${resourcesId} 0 R >>`);

    // Content stream
    const contentBytes = new TextEncoder().encode(page.content);
    writeObj(contentId, `<< /Length ${contentBytes.length} >>\nstream\n${page.content}\nendstream`);

    // Resources
    writeObj(resourcesId, `<< /Font << /F1 ${3} 0 R /F2 ${4} 0 R >> >>`);
  }

  // xref
  const xrefStart = currentOffset;
  write('xref\n');
  write(`0 ${objOffsets.length}\n`);
  write('0000000000 65535 f \n');
  for (let i = 1; i < objOffsets.length; i++) {
    write(`${String(objOffsets[i]).padStart(10, '0')} 00000 n \n`);
  }

  // trailer
  write(`trailer\n<< /Size ${objOffsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new TextEncoder().encode(lines.join(''));
}

/**
 * High-level API: Generate PDF from structured content
 */
export interface PDFContent {
  title: string;
  author: string;
  sections: Array<{
    heading: string;
    body: string[];
    style?: 'heading' | 'body' | 'bullet';
  }>;
}

export function generatePDFFromContent(content: PDFContent): Uint8Array {
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 72; // 1 inch = 72 points
  const maxWidth = pageWidth - 2 * margin;
  let y = margin + 20;
  const pdfLines: Array<{ text: string; x: number; y: number; fontSize: number; font: string }> = [];

  const addLine = (text: string, options: { x?: number; y?: number; fontSize?: number; font?: string } = {}) => {
    pdfLines.push({
      text,
      x: options.x ?? margin,
      y: options.y ?? y,
      fontSize: options.fontSize ?? 10,
      font: options.font ?? 'normal',
    });
    y += (options.fontSize ?? 10) * 1.5;
  };

  // Title
  addLine(content.title, { fontSize: 18, font: 'bold', x: margin, y });
  y += 10;

  // Author
  addLine(content.author, { fontSize: 10, font: 'normal', x: margin, y });
  y += 20;

  // Sections
  for (const section of content.sections) {
    // Check page break
    if (y > pageHeight - margin - 40) {
      // In a real implementation, we'd start a new page
      // For now, just continue
    }

    if (section.style === 'heading') {
      addLine(section.heading, { fontSize: 12, font: 'bold' });
    } else {
      addLine(section.heading, { fontSize: 10, font: 'bold' });
    }

    for (const line of section.body) {
      // Simple word wrap
      const words = line.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        // Approximate width check
        if (testLine.length * 5 > maxWidth && currentLine) {
          addLine(currentLine, { fontSize: 10, font: 'normal' });
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) addLine(currentLine, { fontSize: 10, font: 'normal' });
    }
    y += 6;
  }

  // Build page content stream
  let contentStream = '';
  let currentFont = '';
  for (const line of pdfLines) {
    const fontKey = line.font === 'bold' ? '/F2' : '/F1';
    if (fontKey !== currentFont) {
      contentStream += `${fontKey} ${line.fontSize} Tf\n`;
      currentFont = fontKey;
    }
    contentStream += `${line.x} ${pageHeight - line.y} Td\n`;
    contentStream += `(${escapePDFString(line.text)}) Tj\n`;
  }

  const page = {
    width: pageWidth,
    height: pageHeight,
    content: contentStream,
    resources: { fonts: new Map() },
  };

  const doc: PDFDocument = {
    pages: [page],
    info: {
      title: content.title,
      author: content.author,
      subject: '',
      creator: 'Career Automation Centre',
      producer: 'Career Automation Centre',
      creationDate: new Date().toISOString(),
      modDate: new Date().toISOString(),
    },
  };

  return generateCompletePDF(doc);
}

/**
 * Generate Word-compatible HTML (.doc) export
 */
export function generateWordHTML(content: PDFContent): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(content.title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; margin: 1in; font-size: 11pt; line-height: 1.15; }
    h1 { font-size: 18pt; font-weight: bold; margin-bottom: 6pt; color: #1a1a1a; }
    h2 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; color: #2d2d2d; }
    p { margin: 0 0 6pt 0; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 12pt; }
    ul { margin: 0 0 6pt 24pt; padding: 0; }
    li { margin: 2pt 0; }
  </style>
</head>
<body>
  <h1>${escapeHTML(content.title)}</h1>
  <p class="meta">${escapeHTML(content.author)}</p>
  ${content.sections.map(s => {
    if (s.style === 'heading') {
      return `<h2>${escapeHTML(s.heading)}</h2>`;
    } else if (s.style === 'bullet') {
      return `<p><strong>${escapeHTML(s.heading)}</strong></p><ul>${s.body.map(b => `<li>${escapeHTML(b)}</li>`).join('')}</ul>`;
    } else {
      return `<p><strong>${escapeHTML(s.heading)}</strong></p>${s.body.map(b => `<p>${escapeHTML(b)}</p>`).join('')}`;
    }
  }).join('\n')}
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

/**
 * Generate plain text export
 */
export function generateText(content: PDFContent): string {
  let out = `${content.title}\n${content.author}\n${'='.repeat(Math.max(content.title.length, content.author.length))}\n\n`;
  for (const section of content.sections) {
    out += `${section.heading}\n`;
    out += '-'.repeat(section.heading.length) + '\n';
    for (const line of section.body) {
      out += `  ${line}\n`;
    }
    out += '\n';
  }
  return out;
}

/**
 * Convert CV JSON to PDFContent
 */
export interface CVContent {
  contact?: { name: string; email: string; phone?: string; location?: string; linkedin?: string; github?: string; portfolio?: string };
  headline?: string;
  summary?: string;
  sections: Array<{
    type: 'skills' | 'experience' | 'education' | 'projects' | 'certifications' | 'custom';
    title: string;
    visible: boolean;
    order: number;
    entries: Array<{
      title: string;
      subtitle?: string;
      meta?: string;
      date?: string;
      bullets: string[];
      evidenceRefs?: Array<{ table: string; id: number }>;
    }>;
  }>;
}

export function cvContentToPDFContent(cv: CVContent): PDFContent {
  const sections: PDFContent['sections'] = [];

  // Contact
  if (cv.contact) {
    const contactLines = [
      cv.contact.name,
      cv.contact.email,
      cv.contact.phone,
      cv.contact.location,
      cv.contact.linkedin,
      cv.contact.github,
      cv.contact.portfolio,
    ].filter((v): v is string => Boolean(v));
    sections.push({ heading: 'Contact', body: contactLines, style: 'body' });
  }

  // Headline
  if (cv.headline) {
    sections.push({ heading: 'Professional Headline', body: [cv.headline], style: 'body' });
  }

  // Summary
  if (cv.summary) {
    sections.push({ heading: 'Professional Summary', body: [cv.summary], style: 'body' });
  }

  // Sections
  const sortedSections = [...cv.sections].sort((a, b) => a.order - b.order).filter(s => s.visible);
  for (const section of sortedSections) {
    const bullets: string[] = [];
    for (const entry of section.entries) {
      let entryText = entry.title;
      if (entry.subtitle) entryText += ` — ${entry.subtitle}`;
      if (entry.meta) entryText += ` | ${entry.meta}`;
      if (entry.date) entryText += ` | ${entry.date}`;
      bullets.push(entryText);
      for (const bullet of entry.bullets) {
        bullets.push(`• ${bullet}`);
      }
    }
    sections.push({ heading: section.title, body: bullets, style: 'bullet' });
  }

  return {
    title: cv.contact?.name || 'Curriculum Vitae',
    author: cv.contact?.name || 'Generated by Career Automation Centre',
    sections,
  };
}