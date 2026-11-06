'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  CreditCard, 
  CalendarClock, 
  Home, 
  Layers, 
  SlidersHorizontal,
  Check,
  Printer,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { DashboardSummary, ParsedInvoice, formatBRL } from '@/lib/invoiceParser';
import { ExternalExpense } from '@/components/ExternalExpenses';
import { AIAnalysisResult } from '@/lib/aiExpenseClassifier';
import { 
  PdfReportOptions, 
  DEFAULT_PDF_OPTIONS, 
  downloadFinancialPdfReport, 
  previewFinancialPdfReport,
  formatPdfBRL
} from '@/lib/pdfReportGenerator';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DashboardSummary | null;
  externalExpenses?: ExternalExpense[];
  externalExpensesTotal?: number;
  invoices?: ParsedInvoice[];
  aiAnalysis?: AIAnalysisResult;
}

type ReportPreset = 'complete' | 'executive_summary' | 'transactions_focused';

export default function PdfExportModal({
  isOpen,
  onClose,
  summary,
  externalExpenses = [],
  externalExpensesTotal = 0,
  invoices = [],
  aiAnalysis,
}: PdfExportModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<ReportPreset>('complete');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Custom Options
  const [options, setOptions] = useState<PdfReportOptions>({ ...DEFAULT_PDF_OPTIONS });

  if (!isOpen || !summary) return null;

  const grandTotal = summary.totalCurrentSpent + externalExpensesTotal;

  // Handle Preset Selection
  const applyPreset = (preset: ReportPreset) => {
    setSelectedPreset(preset);
    if (preset === 'complete') {
      setOptions({
        ...options,
        includeKpis: true,
        includeAiAnalysis: true,
        includeBanksSummary: true,
        includeCategoryBreakdown: true,
        includeTopCompanies: true,
        includeExternalExpenses: true,
        includeFutureTimeline: true,
        includeTransactions: true,
        transactionFilter: 'all',
      });
    } else if (preset === 'executive_summary') {
      setOptions({
        ...options,
        includeKpis: true,
        includeAiAnalysis: true,
        includeBanksSummary: true,
        includeCategoryBreakdown: true,
        includeTopCompanies: true,
        includeExternalExpenses: true,
        includeFutureTimeline: true,
        includeTransactions: false,
        transactionFilter: 'none',
      });
    } else if (preset === 'transactions_focused') {
      setOptions({
        ...options,
        includeKpis: true,
        includeAiAnalysis: false,
        includeBanksSummary: true,
        includeCategoryBreakdown: false,
        includeTopCompanies: false,
        includeExternalExpenses: false,
        includeFutureTimeline: false,
        includeTransactions: true,
        transactionFilter: 'all',
      });
    }
  };

  const handleDownload = () => {
    try {
      setIsGenerating(true);
      setTimeout(() => {
        downloadFinancialPdfReport({
          summary,
          externalExpenses,
          externalTotal: externalExpensesTotal,
          invoices,
          aiAnalysis,
          options,
        });
        setIsGenerating(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }, 300);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    try {
      setIsGenerating(true);
      setTimeout(() => {
        previewFinancialPdfReport({
          summary,
          externalExpenses,
          externalTotal: externalExpensesTotal,
          invoices,
          aiAnalysis,
          options,
        });
        setIsGenerating(false);
      }, 300);
    } catch (err) {
      console.error('Erro ao visualizar PDF:', err);
      setIsGenerating(false);
    }
  };

  // Transaction count based on current filter
  const estimatedTxCount = (() => {
    if (!options.includeTransactions) return 0;
    let list = summary.allTransactions;
    if (options.selectedBank) list = list.filter((t) => t.bank === options.selectedBank);
    if (options.transactionFilter === 'above50') list = list.filter((t) => t.amount >= 50);
    if (options.transactionFilter === 'parceled') list = list.filter((t) => t.installment && t.installment.total > 1);
    return list.length;
  })();

  const estimatedPages = (() => {
    let p = 1; // cover & KPIs & AI
    if (options.includeBanksSummary && options.includeTopCompanies) p += 1;
    if (options.includeExternalExpenses || options.includeFutureTimeline) p += 0.5;
    if (options.includeTransactions) {
      p += Math.ceil(estimatedTxCount / 32);
    }
    return Math.max(1, Math.ceil(p));
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-white/10 dark:border-white/10 light:border-slate-300 light:bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 light:border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
                  Gerar Relatório em PDF
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  PDF Executivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exporte seu extrato financeiro conciliado com layout profissional pronto para impressão ou envio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-200 light:text-slate-700">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200 text-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Total Consolidado
              </span>
              <span className="text-sm sm:text-base font-bold text-white dark:text-white light:text-slate-900 block mt-0.5">
                {formatBRL(grandTotal)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Faturas dos Cartões
              </span>
              <span className="text-sm sm:text-base font-bold text-rose-400 block mt-0.5">
                {formatBRL(summary.totalCurrentSpent)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Páginas Estimadas
              </span>
              <span className="text-sm sm:text-base font-bold text-indigo-400 block mt-0.5">
                ~{estimatedPages} {estimatedPages === 1 ? 'página' : 'páginas'}
              </span>
            </div>
          </div>

          {/* Preset Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 block mb-2.5">
              Escolha o Formato do Relatório:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Complete */}
              <button
                type="button"
                onClick={() => applyPreset('complete')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedPreset === 'complete'
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                    : 'border-white/5 bg-slate-950/40 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-400" />
                    Completo
                  </span>
                  {selectedPreset === 'complete' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Auditoria IA, Bancos, Fixos, Empresas e Todos os Lançamentos.
                </p>
                <span className="mt-2 inline-block text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  Mais Recomendado
                </span>
              </button>

              {/* Option 2: Executive Summary */}
              <button
                type="button"
                onClick={() => applyPreset('executive_summary')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedPreset === 'executive_summary'
                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/15'
                    : 'border-white/5 bg-slate-950/40 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Resumo Executivo
                  </span>
                  {selectedPreset === 'executive_summary' && (
                    <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  KPIs, Auditoria de IA, Bancos e Fixos (sem a lista longa de itens).
                </p>
                <span className="mt-2 inline-block text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold">
                  1 a 2 Páginas
                </span>
              </button>

              {/* Option 3: Transactions */}
              <button
                type="button"
                onClick={() => applyPreset('transactions_focused')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedPreset === 'transactions_focused'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15'
                    : 'border-white/5 bg-slate-950/40 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Extrato de Itens
                  </span>
                  {selectedPreset === 'transactions_focused' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Focado na lista contábil detalhada e conferência de parcelas.
                </p>
                <span className="mt-2 inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  Conferência
                </span>
              </button>
            </div>
          </div>

          {/* Advanced Customization Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Ocultar opções avançadas de personalização' : 'Personalizar seções e filtros avançados do PDF...'}</span>
            </button>
          </div>

          {/* Advanced Settings Accordion */}
          {showAdvanced && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Seções Inclusas no Documento:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeKpis}
                    onChange={(e) => setOptions({ ...options, includeKpis: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Cartões de KPIs & Destaques</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeAiAnalysis}
                    onChange={(e) => setOptions({ ...options, includeAiAnalysis: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Auditoria de IA (Essencial vs Variável)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeBanksSummary}
                    onChange={(e) => setOptions({ ...options, includeBanksSummary: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Resumo por Banco & Cartão</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeTopCompanies}
                    onChange={(e) => setOptions({ ...options, includeTopCompanies: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Ranking de Maiores Estabelecimentos</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeExternalExpenses}
                    onChange={(e) => setOptions({ ...options, includeExternalExpenses: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Despesas Fixas Fora do Cartão</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeFutureTimeline}
                    onChange={(e) => setOptions({ ...options, includeFutureTimeline: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Projeção Futura de Parcelas</span>
                </label>
              </div>

              {/* Transactions Specific Filter */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeTransactions}
                    onChange={(e) => setOptions({ ...options, includeTransactions: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Incluir Tabela Detalhada de Lançamentos ({summary.allTransactions.length} totais)</span>
                </label>

                {options.includeTransactions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-5">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Filtrar Lançamentos:</span>
                      <select
                        value={options.transactionFilter || 'all'}
                        onChange={(e) => setOptions({ ...options, transactionFilter: e.target.value as any })}
                        className="w-full text-xs p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200"
                      >
                        <option value="all">Todos os Lançamentos ({summary.allTransactions.length})</option>
                        <option value="above50">Apenas valores acima de R$ 50,00</option>
                        <option value="parceled">Apenas compras parceladas</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Filtrar por Banco / Instituição:</span>
                      <select
                        value={options.selectedBank || 'ALL'}
                        onChange={(e) => setOptions({ ...options, selectedBank: e.target.value === 'ALL' ? null : e.target.value })}
                        className="w-full text-xs p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200"
                      >
                        <option value="ALL">Todos os Bancos ({invoices.length} faturas)</option>
                        {invoices.map((inv) => (
                          <option key={inv.bank} value={inv.bank}>
                            {inv.bank} ({inv.transactions.length} itens)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Relatório em PDF gerado e baixado com sucesso no seu computador!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 light:border-slate-200 bg-slate-950/60 light:bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Processamento 100% no cliente. Seus dados financeiros não saem da sua máquina.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Preview Button */}
            <button
              type="button"
              onClick={handlePreview}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Visualizar</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
