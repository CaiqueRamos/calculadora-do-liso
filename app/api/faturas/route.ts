import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseInvoiceText, compileDashboardSummary, ParsedInvoice } from '@/lib/invoiceParser';

// Dynamic import or require for pdf-parse
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

const FATURAS_DIR = path.join(process.cwd(), 'app', 'faturas');

async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const res = await parser.getText();
  if (res.pages && Array.isArray(res.pages)) {
    return res.pages.map((p: { text: string }) => p.text).join('\n');
  }
  return res.text || '';
}

export async function GET() {
  try {
    if (!fs.existsSync(FATURAS_DIR)) {
      fs.mkdirSync(FATURAS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(FATURAS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    const invoices: ParsedInvoice[] = [];

    for (const filename of files) {
      try {
        const filePath = path.join(FATURAS_DIR, filename);
        const buffer = fs.readFileSync(filePath);
        const text = await extractTextFromBuffer(buffer);
        const invoice = parseInvoiceText(text, filename);
        invoices.push(invoice);
      } catch (err) {
        console.error(`Error parsing invoice ${filename}:`, err);
      }
    }

    const summary = compileDashboardSummary(invoices);

    return NextResponse.json({
      success: true,
      invoices,
      summary,
    });
  } catch (error: unknown) {
    console.error('Failed to load invoices:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to app/faturas directory so it persists
    if (!fs.existsSync(FATURAS_DIR)) {
      fs.mkdirSync(FATURAS_DIR, { recursive: true });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    const savePath = path.join(FATURAS_DIR, safeName);
    fs.writeFileSync(savePath, buffer);

    // Extract & parse
    const text = await extractTextFromBuffer(buffer);
    const newInvoice = parseInvoiceText(text, safeName);

    // Recompute total summary
    const allFiles = fs.readdirSync(FATURAS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    const allInvoices: ParsedInvoice[] = [];
    for (const f of allFiles) {
      try {
        const b = fs.readFileSync(path.join(FATURAS_DIR, f));
        const t = await extractTextFromBuffer(b);
        allInvoices.push(parseInvoiceText(t, f));
      } catch (e) {
        console.error(e);
      }
    }
    const summary = compileDashboardSummary(allInvoices);

    return NextResponse.json({
      success: true,
      invoice: newInvoice,
      summary,
    });
  } catch (error: unknown) {
    console.error('Error processing uploaded file:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
