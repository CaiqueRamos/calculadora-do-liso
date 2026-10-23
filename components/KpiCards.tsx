'use client';

import React from 'react';
import { 
  CreditCard, 
  CalendarClock, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { formatBRL, DashboardSummary } from '@/lib/invoiceParser';

interface KpiCardsProps {
  summary: DashboardSummary;
}

export default function KpiCards({ summary }: KpiCardsProps) {
  const limitUsedPct = summary.totalCombinedLimit > 0
    ? Math.round((summary.totalLimitUsed / summary.totalCombinedLimit) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
      {/* 1. GASTOS ATUAIS */}
      <div className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl group border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-900/60 to-slate-950/80 dark:from-rose-500/10 dark:via-slate-900/60 dark:to-slate-950/80 light:bg-white light:border-rose-200 light:shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 dark:text-rose-400 light:text-rose-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Total Gasto Atual
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 dark:text-rose-400 light:text-rose-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            {formatBRL(summary.totalCurrentSpent)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-1">
            <span>Faturas de Outubro / 2026</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-medium">3 cartões</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 light:border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
            {summary.totalTransactionsCount} lançamentos lidos
          </span>
          <span className="text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold text-[11px]">
            Vencimentos 10 a 13/10
          </span>
        </div>
      </div>

      {/* 2. VALORES FUTUROS COMPROMETIDOS */}
      <div className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl group border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-950/80 dark:from-amber-500/10 dark:via-slate-900/60 dark:to-slate-950/80 light:bg-white light:border-amber-200 light:shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 dark:text-amber-400 light:text-amber-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Valores Futuros
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 dark:text-amber-400 light:text-amber-600">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            {formatBRL(summary.totalFutureCommitted)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-1">
            <span>Parcelas futuras a vencer</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400 font-medium">Até 2027</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 light:border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Compras parceladas
          </span>
          <span className="text-amber-400 font-medium text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            Previsão garantida
          </span>
        </div>
      </div>

      {/* 3. PRÓXIMA FATURA (NOVEMBRO) */}
      <div className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl group border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-950/80 dark:from-indigo-500/10 dark:via-slate-900/60 dark:to-slate-950/80 light:bg-white light:border-indigo-200 light:shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-400 light:text-indigo-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Próximo Mês ({summary.nextMonthName})
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 dark:text-indigo-400 light:text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            {formatBRL(summary.nextMonthTotal || 4542.72)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-1">
            <span>Previsão de parcelas já contratadas</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 light:border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5 rotate-90" />
            Redução no compromisso
          </span>
          <span className="text-slate-400 text-[11px]">
            Sem compras novas
          </span>
        </div>
      </div>

      {/* 4. LIMITE COMBINADO DOS CARTÕES */}
      <div className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl group border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-950/80 dark:from-emerald-500/10 dark:via-slate-900/60 dark:to-slate-950/80 light:bg-white light:border-emerald-200 light:shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 dark:text-emerald-400 light:text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Limite Total Disponível
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 dark:text-emerald-400 light:text-emerald-600">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            {formatBRL(summary.totalLimitAvailable || 40868.26)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
            De um teto total de {formatBRL(summary.totalCombinedLimit)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-white/5 light:border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Uso do Limite Global</span>
            <span className="font-semibold text-white dark:text-white light:text-slate-900">{limitUsedPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.max(5, limitUsedPct))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
