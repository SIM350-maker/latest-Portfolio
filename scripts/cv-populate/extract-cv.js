'use strict';
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

(async () => {
  const buf = fs.readFileSync(path.resolve(__dirname, '..', '..', 'SIMON IPARA CV.pdf'));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const result = await parser.getText();
  fs.writeFileSync(path.resolve(__dirname, 'cv-extracted.txt'), result.text, 'utf8');
  console.log('pages:', result.pages?.length ?? result.numpages, 'chars:', result.text.length);
  await parser.destroy();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
