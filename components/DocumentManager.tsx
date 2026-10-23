'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Calendar, 
  CreditCard, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ParsedInvoice, formatBRL } from '@/lib/invoiceParser';

interface DocumentManagerProps {
  invoices: ParsedInvoice[];
  onUploadFile: (file: File) => Promise<void>;
  isUploading: boolean;
  onRefresh: () => void;
}

export default function DocumentManager({
  invoices,
  onUploadFile,
  isUploading,
  onRefresh,
}: DocumentManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<ParsedInvoice | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await onUploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await onUploadFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-white/15 hover:border-indigo-500/50 bg-slate-900/40 light:bg-slate-50 light:border-slate-300'
        }`}
      >
        <input
          type="file"
          id="invoice-file-upload"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            {isUploading ? (
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              {isUploading ? 'Processando Documento OCR...' : 'Arraste e solte sua fatura em PDF'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Suporta faturas de bancos brasileiros (Nubank, Itaú, Bradesco, Santander, Inter, C6, etc.)
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 shadow-md shadow-indigo-600/30 transition-all pointer-events-auto hover:bg-indigo-500"
          >
            Selecionar arquivo do computador
          </button>
        </div>
      </div>

      {/* Loaded Invoices List */}
      <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Documentos de Faturas Carregados
            </h3>
            <span className="text-xs text-slate-400">
              ({invoices.length} arquivos processados na pasta)
            </span>
          </div>

          <button
            onClick={onRefresh}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recarregar pasta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-xl border border-white/10 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      inv.bank === 'Bradesco'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : inv.bank === 'Itaú'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}
                  >
                    {inv.bank}
                  </span>

                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Lido com sucesso
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-900 truncate" title={inv.filename}>
                  {inv.filename}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Titular: {inv.cardHolder}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 light:border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Identificado</span>
                  <span className="font-bold text-white dark:text-white light:text-slate-900">
                    {formatBRL(inv.totalCurrent)}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedInvoicePreview(inv)}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-indigo-400 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver dados brutos
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Preview Modal */}
      {selectedInvoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Auditoria de Leitura: {selectedInvoicePreview.bank}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedInvoicePreview.filename}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoicePreview(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-400">Vencimento:</span>{' '}
                <span className="font-semibold text-white">{selectedInvoicePreview.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Fatura:</span>{' '}
                <span className="font-semibold text-emerald-400">{formatBRL(selectedInvoicePreview.totalCurrent)}</span>
              </div>
              <div>
                <span className="text-slate-400">Valores Futuros:</span>{' '}
                <span className="font-semibold text-amber-400">{formatBRL(selectedInvoicePreview.totalFuture)}</span>
              </div>
              <div>
                <span className="text-slate-400">Lançamentos extraídos:</span>{' '}
                <span className="font-semibold text-white">{selectedInvoicePreview.transactions.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <span className="text-xs font-semibold text-slate-400 block">Texto extraído pelo leitor:</span>
              <pre className="p-3 rounded-xl bg-slate-900 border border-white/5 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {selectedInvoicePreview.rawTextPreview || 'Sem prévia de texto disponível.'}
              </pre>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedInvoicePreview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
