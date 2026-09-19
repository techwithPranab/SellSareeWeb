'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminModal from './AdminModal';
import { adminService, type BulkProductResult } from '@/services/admin.service';

const HEADERS = ['name', 'sku', 'category', 'description', 'shortDescription', 'fabric', 'color', 'colorCode', 'pattern', 'price', 'buyPrice', 'discountedPrice', 'stock', 'isActive'];
const REQUIRED = ['name', 'sku', 'category', 'fabric', 'color', 'price'];
const TEMPLATE_ROW = ['Sample Silk Saree', 'SAREE-001', 'silk', 'Elegant silk saree', 'Festive collection', 'silk', 'Red', '#B91C1C', 'Woven', '2499', '1200', '2199', '10', 'false'];

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim()); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error('The CSV contains an unclosed quoted value');
  return rows;
}

export default function BulkProductUpload({ onComplete }: { onComplete: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<BulkProductResult[]>([]);

  const downloadTemplate = () => {
    const content = [HEADERS, TEMPLATE_ROW].map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pps-aura-product-bulk-upload-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const uploadFile = async () => {
    if (!file) return toast.error('Choose a CSV file first');
    setUploading(true);
    setResults([]);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('The CSV has no product rows');
      const headers = rows[0].map((header) => header.trim());
      const missingHeaders = REQUIRED.filter((header) => !headers.includes(header));
      if (missingHeaders.length) throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      const products = rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
      if (products.length > 100) throw new Error('A maximum of 100 products can be uploaded at once');
      const response = await adminService.bulkCreateProducts(products);
      setResults(response.results);
      if (response.created) await onComplete();
      if (response.failed) toast.error(`${response.created} created, ${response.failed} failed`);
      else toast.success(`${response.created} products created`);
    } catch (error: unknown) {
      const requestMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(requestMessage || (error instanceof Error ? error.message : 'Bulk upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return <>
    <button type="button" onClick={downloadTemplate} className="btn-outline btn-sm gap-1.5"><Download className="h-4 w-4" />Template</button>
    <button type="button" onClick={() => setOpen(true)} className="btn-outline btn-sm gap-1.5"><Upload className="h-4 w-4" />Bulk Upload</button>
    <AdminModal open={open} onClose={() => !uploading && setOpen(false)} title="Bulk Upload Products" size="lg">
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
          Download the template, keep its column names unchanged, and add up to 100 products. Category may be its name, slug, or ID. Products are created inactive with a branded dummy image unless <strong>isActive</strong> is set to true.
        </div>
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface p-5 text-center hover:border-primary/50">
          <FileSpreadsheet className="mb-2 h-8 w-8 text-primary" />
          <span className="text-sm font-medium">{file?.name || 'Choose CSV file'}</span>
          <span className="mt-1 text-xs text-muted-foreground">CSV only · maximum 100 rows</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { setFile(event.target.files?.[0] || null); setResults([]); }} />
        </label>
        {results.length > 0 && <div className="max-h-52 overflow-auto rounded-xl border border-border"><table className="w-full text-xs"><thead className="sticky top-0 bg-surface"><tr><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">SKU</th><th className="px-3 py-2 text-left">Result</th></tr></thead><tbody className="divide-y divide-border">{results.map((result) => <tr key={`${result.row}-${result.sku}`}><td className="px-3 py-2">{result.row}</td><td className="px-3 py-2 font-mono">{result.sku || '—'}</td><td className={`px-3 py-2 ${result.success ? 'text-green-700' : 'text-red-600'}`}>{result.success ? 'Created' : result.error}</td></tr>)}</tbody></table></div>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={downloadTemplate} className="btn-outline btn-sm gap-2"><Download className="h-4 w-4" />Download Template</button><div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} disabled={uploading} className="btn-outline btn-sm">Close</button><button type="button" onClick={uploadFile} disabled={!file || uploading} className="btn-primary btn-sm gap-2">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? 'Uploading…' : 'Upload Products'}</button></div></div>
      </div>
    </AdminModal>
  </>;
}
