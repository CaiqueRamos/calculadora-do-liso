'use client';

import React from 'react';
import { 
  FileText, 
  UploadCloud, 
  RefreshCw, 
  Download, 
  Moon, 
  Sun,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  onOpenUpload: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onExportCsv: () => void;
  invoicesCount: number;
}

export default function Header({
  isDark,
  setIsDark,
  onOpenUpload,
  onRefresh,
  isLoading,
  onExportCsv,
  invoicesCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl border-b transition-colors duration-200 border-white/10 bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                FaturaFlow
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                OCR Inteligente
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Leitor de Faturas & Projeção Financeira</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-500"></span>
              <span className="flex items-center gap-1 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Outubro / 2026
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Document count pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 border border-white/5 light:border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{invoicesCount} {invoicesCount === 1 ? 'fatura lida' : 'faturas lidas'}</span>
          </div>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            title="Exportar lançamentos para CSV"
            className="p-2.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border-white/10 light:border-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Recarregar faturas da pasta"
            className="p-2.5 rounded-xl border transition-all text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border-white/10 light:border-slate-200 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
            className="p-2.5 rounded-xl border transition-all bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border-white/10 light:border-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800 hover:text-white"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 transform active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Adicionar Fatura</span>
          </button>
        </div>
      </div>
    </header>
  );
}
