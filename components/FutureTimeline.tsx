'use client';

import React, { useState } from 'react';
import { 
  CalendarClock, 
  TrendingDown, 
  Sparkles, 
  ChevronRight, 
  ArrowRight,
  Info,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import { MonthlyFutureCommitment, formatBRL } from '@/lib/invoiceParser';

interface FutureTimelineProps {
  timeline: {
    monthKey: string;
    monthLabel: string;
    amount: number;
    byBank: Record<string, number>;
  }[];
  monthlyCommitments: MonthlyFutureCommitment[];
  selectedMonthKey?: string | null;
  onSelectMonth?: (monthKey: string | null) => void;
}

export default function FutureTimeline({
  timeline,
  monthlyCommitments,
  selectedMonthKey: controlledMonthKey,
  onSelectMonth,
}: FutureTimelineProps) {
  const [localMonthKey, setLocalMonthKey] = useState<string | null>(null);

  // Controlled or uncontrolled
  const activeMonthKey = controlledMonthKey !== undefined ? controlledMonthKey : localMonthKey;

  const handleMonthClick = (monthKey: string) => {
    const nextKey = activeMonthKey === monthKey ? null : monthKey;
    if (onSelectMonth) {
      onSelectMonth(nextKey);
    } else {
      setLocalMonthKey(nextKey);
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 p-8 text-center bg-slate-900/50">
        <CalendarClock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Nenhum compromisso futuro em aberto detectado.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...timeline.map((t) => t.amount), 1);
  const activeDetails = activeMonthKey 
    ? monthlyCommitments.find((m) => m.monthKey === activeMonthKey) 
    : (monthlyCommitments.find((m) => m.monthKey === timeline[0]?.monthKey) || monthlyCommitments[0]);

  return (
    <div className="rounded-2xl border p-6 backdrop-blur-xl transition-all border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-400" />
              Linha do Tempo: Gastos Futuros & Parcelamentos
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Projeção Mensal
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
            Clique em qualquer mês para <strong className="text-amber-400 font-semibold">filtrar a lista de compras parceladas</strong> abaixo
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Bradesco</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Itaú</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Nubank</span>
          </div>
        </div>
      </div>

      {/* Selected Month Filter Notification Banner */}
      {activeMonthKey && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>
              Filtro ativo: Exibindo parcelas com vencimento em{' '}
              <strong>{timeline.find((t) => t.monthKey === activeMonthKey)?.monthLabel || activeMonthKey}</strong>
            </span>
          </div>
          <button
            onClick={() => handleMonthClick(activeMonthKey)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-white font-medium transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar filtro</span>
          </button>
        </div>
      )}

      {/* Bar Chart Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 pb-4">
        {timeline.slice(0, 6).map((item) => {
          const isSelected = activeMonthKey === item.monthKey;
          const heightPct = Math.max(15, Math.round((item.amount / maxAmount) * 100));

          return (
            <div
              key={item.monthKey}
              onClick={() => handleMonthClick(item.monthKey)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400 scale-[1.02]'
                  : 'border-white/5 hover:border-amber-400/40 bg-slate-950/40 hover:bg-slate-900/80 light:bg-slate-50 light:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-3">
                <span className={`font-semibold ${isSelected ? 'text-amber-400 font-bold' : 'text-slate-300 dark:text-slate-300 light:text-slate-700'}`}>
                  {item.monthLabel}
                </span>
                {isSelected ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                ) : (
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Filtrar
                  </span>
                )}
              </div>

              {/* Vertical Stacked Bar */}
              <div className="h-24 w-full flex items-end justify-center py-1">
                <div 
                  className="w-full rounded-lg overflow-hidden bg-slate-800/80 flex flex-col-reverse transition-all duration-500 group-hover:brightness-110"
                  style={{ height: `${heightPct}%` }}
                >
                  {/* Segment: Nubank */}
                  {item.byBank['Nubank'] && (
                    <div 
                      className="bg-purple-500 w-full"
                      style={{ height: `${((item.byBank['Nubank'] || 0) / item.amount) * 100}%` }}
                      title={`Nubank: ${formatBRL(item.byBank['Nubank'])}`}
                    ></div>
                  )}
                  {/* Segment: Itaú */}
                  {item.byBank['Itaú'] && (
                    <div 
                      className="bg-amber-500 w-full"
                      style={{ height: `${((item.byBank['Itaú'] || 0) / item.amount) * 100}%` }}
                      title={`Itaú: ${formatBRL(item.byBank['Itaú'])}`}
                    ></div>
                  )}
                  {/* Segment: Bradesco */}
                  {item.byBank['Bradesco'] && (
                    <div 
                      className="bg-rose-500 w-full"
                      style={{ height: `${((item.byBank['Bradesco'] || 0) / item.amount) * 100}%` }}
                      title={`Bradesco: ${formatBRL(item.byBank['Bradesco'])}`}
                    ></div>
                  )}
                </div>
              </div>

              {/* Month Amount */}
              <div className="mt-3 text-center">
                <div className={`text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-white dark:text-white light:text-slate-900'}`}>
                  {formatBRL(item.amount)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {isSelected ? 'selecionado' : 'previsto'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Month Detailed Breakdown */}
      {activeDetails && (
        <div className="mt-4 pt-4 border-t border-white/10 light:border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Detalhamento de Parcelas para {activeDetails.monthLabel}:
            </h4>
            <span className="text-xs font-bold text-amber-400">
              Total do mês: {formatBRL(activeDetails.totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {activeDetails.items.slice(0, 9).map((it, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-white/5 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-800 truncate">
                    {it.description}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span 
                      className={`font-semibold ${
                        it.bank === 'Bradesco' ? 'text-rose-400' : it.bank === 'Itaú' ? 'text-amber-400' : 'text-purple-400'
                      }`}
                    >
                      {it.bank}
                    </span>
                    <span>•</span>
                    <span>Parcela {it.installmentNumber}/{it.totalInstallments}</span>
                  </div>
                </div>

                <div className="font-bold text-white dark:text-white light:text-slate-900 whitespace-nowrap">
                  {formatBRL(it.amount)}
                </div>
              </div>
            ))}
          </div>
          {activeDetails.items.length > 9 && (
            <p className="text-[11px] text-slate-400 mt-2 text-right">
              + {activeDetails.items.length - 9} outros lançamentos parcelados
            </p>
          )}
        </div>
      )}
    </div>
  );
}
