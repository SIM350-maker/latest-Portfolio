// Pure-TS PDF text extraction (no external dependencies)
// Supports FlateDecode streams and basic text operators (TJ, Tj, ', ", etc.)

interface PDFObject {
  type: 'dict' | 'array' | 'stream' | 'ref' | 'name' | 'string' | 'number' | 'boolean' | 'null';
  value: any;
}

interface PDFStream {
  dict: Record<string, any>;
  data: Uint8Array;
}

interface PDFParser {
  bytes: Uint8Array;
  offset: number;
  xref: Map<number, number>; // object number -> byte offset
  objects: Map<number, PDFObject>;
}

function skipWhitespace(parser: PDFParser): void {
  while (parser.offset < parser.bytes.length) {
    const c = parser.bytes[parser.offset];
    if (c > 32) break; // not whitespace (space=32, \n=10, \r=13, \t=9, \f=12)
    parser.offset++;
  }
}

function parseNumber(parser: PDFParser): number {
  skipWhitespace(parser);
  const start = parser.offset;
  let hasDot = false;
  while (parser.offset < parser.bytes.length) {
    const c = parser.bytes[parser.offset];
    if ((c >= 48 && c <= 57) || (!hasDot && c === 46)) { // 0-9 or .
      if (c === 46) hasDot = true;
      parser.offset++;
    } else break;
  }
  return parseFloat(new TextDecoder().decode(parser.bytes.slice(start, parser.offset)));
}

function parseString(parser: PDFParser): string {
  skipWhitespace(parser);
  if (parser.bytes[parser.offset] !== 40) throw new Error('Expected ( for string'); // (
  parser.offset++; // skip (
  let depth = 1;
  const start = parser.offset;
  while (parser.offset < parser.bytes.length && depth > 0) {
    const c = parser.bytes[parser.offset];
    if (c === 40) depth++; // (
    else if (c === 41) depth--; // )
    else if (c === 92) parser.offset++; // \ escape
    parser.offset++;
  }
  const end = parser.offset - 1; // before closing )
  return new TextDecoder().decode(parser.bytes.slice(start, end));
}

function parseName(parser: PDFParser): string {
  skipWhitespace(parser);
  if (parser.bytes[parser.offset] !== 47) throw new Error('Expected / for name'); // /
  parser.offset++;
  const start = parser.offset;
  while (parser.offset < parser.bytes.length) {
    const c = parser.bytes[parser.offset];
    if (c > 32 && c !== 40 && c !== 41 && c !== 60 && c !== 62 && c !== 91 && c !== 93 && c !== 123 && c !== 125 && c !== 47 && c !== 35) {
      parser.offset++;
    } else break;
  }
  return '/' + new TextDecoder().decode(parser.bytes.slice(start, parser.offset));
}

function parseArray(parser: PDFParser): any[] {
  skipWhitespace(parser);
  if (parser.bytes[parser.offset] !== 91) throw new Error('Expected [ for array'); // [
  parser.offset++;
  const result: any[] = [];
  while (true) {
    skipWhitespace(parser);
    if (parser.offset >= parser.bytes.length) break;
    if (parser.bytes[parser.offset] === 93) { // ]
      parser.offset++;
      break;
    }
    result.push(parseObject(parser));
  }
  return result;
}

function parseDict(parser: PDFParser): Record<string, any> {
  skipWhitespace(parser);
  if (parser.bytes[parser.offset] !== 60 || parser.bytes[parser.offset + 1] !== 60) { // <<
    throw new Error('Expected << for dict');
  }
  parser.offset += 2;
  const result: Record<string, any> = {};
  while (true) {
    skipWhitespace(parser);
    if (parser.offset >= parser.bytes.length) break;
    if (parser.bytes[parser.offset] === 62 && parser.bytes[parser.offset + 1] === 62) { // >>
      parser.offset += 2;
      break;
    }
    const key = parseName(parser);
    const value = parseObject(parser);
    result[key.slice(1)] = value; // remove leading /
  }
  return result;
}

function parseObject(parser: PDFParser): any {
  skipWhitespace(parser);
  if (parser.offset >= parser.bytes.length) return null;

  const c = parser.bytes[parser.offset];

  if (c === 40) return { type: 'string', value: parseString(parser) }; // (
  if (c === 91) return { type: 'array', value: parseArray(parser) }; // [
  if (c === 60) return { type: 'dict', value: parseDict(parser) }; // <
  if (c === 47) return { type: 'name', value: parseName(parser) }; // /
  if ((c >= 48 && c <= 57) || c === 46 || c === 45) return { type: 'number', value: parseNumber(parser) }; // digit or - or .
  if (c === 116) { // true
    if (new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 4)) === 'true') {
      parser.offset += 4;
      return { type: 'boolean', value: true };
    }
  }
  if (c === 102) { // false
    if (new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 5)) === 'false') {
      parser.offset += 5;
      return { type: 'boolean', value: false };
    }
  }
  if (c === 110) { // null
    if (new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 4)) === 'null') {
      parser.offset += 4;
      return { type: 'null', value: null };
    }
  }
  if (c === 82) { // R (ref)
    const num = parseNumber(parser);
    skipWhitespace(parser);
    const gen = parseNumber(parser);
    skipWhitespace(parser);
    if (new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 1)) === 'R') {
      parser.offset++;
      return { type: 'ref', value: { num, gen } };
    }
  }

  return null;
}

function readXref(parser: PDFParser): void {
  // Find startxref
  const text = new TextDecoder().decode(parser.bytes);
  const startxrefMatch = text.match(/startxref\s+(\d+)/i);
  if (!startxrefMatch) throw new Error('startxref not found');
  const xrefOffset = parseInt(startxrefMatch[1], 10);

  parser.offset = xrefOffset;
  skipWhitespace(parser);
  if (new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 4)) !== 'xref') {
    throw new Error('xref not at expected position');
  }
  parser.offset += 4;

  while (true) {
    skipWhitespace(parser);
    if (parser.offset >= parser.bytes.length) break;
    const c = parser.bytes[parser.offset];
    if (c === 116) { // trailer
      break;
    }
    // subsection: first_object count
    const firstObj = parseNumber(parser);
    const count = parseNumber(parser);
    for (let i = 0; i < count; i++) {
      skipWhitespace(parser);
      const offset = parseNumber(parser);
      skipWhitespace(parser);
      const gen = parseNumber(parser);
      skipWhitespace(parser);
      const inUse = new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 1));
      parser.offset++;
      if (inUse === 'n') {
        parser.objects.set(firstObj + i, { type: 'ref', value: { num: firstObj + i, gen, offset } });
      }
    }
  }
}

function inflateFlate(data: Uint8Array): Uint8Array {
  // Minimal zlib/deflate implementation using Node's zlib
  // We import dynamically to avoid bundling issues
  const zlib = require('zlib');
  try {
    return zlib.inflateSync(data);
  } catch {
    try {
      return zlib.inflateRawSync(data);
    } catch {
      return data; // return as-is if not compressed
    }
  }
}

function extractTextFromStream(stream: PDFStream): string {
  const filter = stream.dict.Filter;
  let data = stream.data;

  if (filter === 'FlateDecode' || (Array.isArray(filter) && filter.includes('FlateDecode'))) {
    data = inflateFlate(data);
  }
  // Add more filters if needed (ASCIIHexDecode, ASCII85Decode, LZWDecode, etc.)

  // Parse text operators from content stream
  // This is a simplified extractor for TJ, Tj, ', ", T* operators
  const text = new TextDecoder('latin1').decode(data);
  const results: string[] = [];

  // Match string operands: (text) or <hex>
  // and operators: Tj, TJ, ', ", T*
  const regex = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ|\(([^)]*)\)\s*'|\(([^)]*)\)\s*"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) results.push(match[1]); // Tj
    if (match[2]) {
      // TJ array - extract strings
      const arrMatch = match[2].match(/\(([^)]*)\)/g);
      if (arrMatch) {
        for (const m of arrMatch) results.push(m.slice(1, -1));
      }
    }
    if (match[3]) results.push(match[3] + ' '); // '
    if (match[4]) results.push(match[4] + ' '); // "
  }

  return results.join(' ').replace(/\s+/g, ' ').trim();
}

export function extractTextFromPDF(bytes: Uint8Array): string {
  const parser: PDFParser = {
    bytes,
    offset: 0,
    xref: new Map(),
    objects: new Map(),
  };

  // Verify PDF header
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  if (header !== '%PDF-') throw new Error('Not a valid PDF file');

  readXref(parser);

  // Traverse objects looking for Pages -> Page -> Contents streams
  const pages = findPages(parser);
  let fullText = '';

  for (const pageRef of pages) {
    const pageObj = resolveObject(parser, pageRef);
    if (pageObj && pageObj.type === 'dict') {
      const contents = pageObj.value.Contents;
      if (contents) {
        const contentRefs = Array.isArray(contents) ? contents : [contents];
        for (const contentRef of contentRefs) {
          if (contentRef.type === 'ref') {
            const streamObj = resolveObject(parser, contentRef);
            if (streamObj && streamObj.type === 'stream') {
              fullText += extractTextFromStream(streamObj.value) + '\n\n';
            }
          }
        }
      }
    }
  }

  return fullText.trim();
}

function findPages(parser: PDFParser): { type: 'ref'; value: { num: number; gen: number } }[] {
  // Find Catalog -> Pages -> Kids
  const catalogRef = findCatalog(parser);
  const catalog = resolveObject(parser, catalogRef);
  if (!catalog || catalog.type !== 'dict') return [];

  const pagesRef = catalog.value.Pages;
  if (!pagesRef || pagesRef.type !== 'ref') return [];

  const pages = resolveObject(parser, pagesRef);
  if (!pages || pages.type !== 'dict') return [];

  const kids = pages.value.Kids;
  if (!kids || kids.type !== 'array') return [];

  return kids.value.filter((k: any) => k.type === 'ref');
}

function findCatalog(parser: PDFParser): { type: 'ref'; value: { num: number; gen: number } } {
  const text = new TextDecoder().decode(parser.bytes);
  const rootMatch = text.match(/\/Root\s+(\d+)\s+(\d+)\s+R/i);
  if (rootMatch) {
    return { type: 'ref', value: { num: parseInt(rootMatch[1], 10), gen: parseInt(rootMatch[2], 10) } };
  }
  // Fallback: object 1 is often catalog
  return { type: 'ref', value: { num: 1, gen: 0 } };
}

function resolveObject(parser: PDFParser, ref: { type: 'ref'; value: { num: number; gen: number } }): PDFObject | null {
  const key = ref.value.num;
  if (parser.objects.has(key)) {
    const cached = parser.objects.get(key)!;
    if (cached.type === 'ref' && cached.value.offset) {
      // Resolve the actual object
      const oldOffset = parser.offset;
      parser.offset = cached.value.offset;
      skipWhitespace(parser);
      // Skip "obj gen obj"
      parseNumber(parser); // obj num
      parseNumber(parser); // gen
      if (new TextDecoder().decode(parser.bytes.slice(parser.offset, parser.offset + 3)) === 'obj') {
        parser.offset += 3;
      }
      const obj = parseObject(parser);
      parser.offset = oldOffset;
      return { type: obj.type || 'dict', value: obj.value };
    }
    return cached;
  }
  return null;
}

// Export simple interface
export interface PDFTextExtractionResult {
  text: string;
  pageCount: number;
  metadata: Record<string, any>;
}

export async function extractPDFText(fileBytes: Buffer): Promise<PDFTextExtractionResult> {
  const uint8 = new Uint8Array(fileBytes);
  const text = extractTextFromPDF(uint8);

  // Count pages roughly
  const pageMatches = new TextDecoder().decode(uint8).match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 1;

  return {
    text,
    pageCount,
    metadata: { extractor: 'pure-ts-flate' },
  };
}