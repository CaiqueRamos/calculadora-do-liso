'use client';

import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  Search, 
  Filter, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  X,
  Calendar
} from 'lucide-react';
import { Transaction, formatBRL } from '@/lib/invoiceParser';

interface InstallmentsTableProps {
  transactions: Transaction[];
  selectedBank: string | null;
  selectedMonthKey?: string | null;
  onSelectMonthKey?: (monthKey: string | null) => void;
  timeline?: {
    monthKey: string;
    monthLabel: string;
    amount: number;
  }[];
}

export default function InstallmentsTable({
  transactions,
  selectedBank,
  selectedMonthKey,
  onSelectMonthKey,
  timeline = [],
}: InstallmentsTableProps) {
  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState<string>(selectedBank || 'ALL');

  // Compute month offset if selectedMonthKey is provided
  // Invoices base is October 2026 (2026-10)
  const monthOffset = useMemo(() => {
    if (!selectedMonthKey) return null;
    const parts = selectedMonthKey.split('-');
    if (parts.length < 2) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return (y - 2026) * 12 + (m - 10);
  }, [selectedMonthKey]);

  // Find month label
  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonthKey) return '';
    return timeline.find((t) => t.monthKey === selectedMonthKey)?.monthLabel || selectedMonthKey;
  }, [selectedMonthKey, timeline]);

  // Filter only transactions with installments
  const installmentTx = useMemo(() => {
    return transactions.filter(
      (t) => t.installment && t.installment.total > 1
    );
  }, [transactions]);

  // Filter based on Bank, Search, and Selected Month
  const filtered = useMemo(() => {
    return installmentTx.filter((t) => {
      // 1. Bank filter
      if (filterBank !== 'ALL' && t.bank !== filterBank) return false;

      // 2. Month filter: is this installment active in the selected month?
      if (monthOffset !== null && monthOffset > 0) {
        const remaining = t.installment?.remaining || 0;
        // If the month offset exceeds remaining installments, this purchase has already ended!
        if (monthOffset > remaining) {
          return false;
        }
      }

      // 3. Search query
      if (search) {
        const q = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.bank.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [installmentTx, filterBank, monthOffset, search]);

  // Calculate totals
  const totalMonthlyCommitment = filtered.reduce((acc, t) => acc + t.amount, 0);
  const totalOutstandingBalance = filtered.reduce((acc, t) => {
    const rem = t.installment?.remaining || 0;
    return acc + t.amount * rem;
  }, 0);

  return (
    <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm space-y-5">
      {/* Header and Summary stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-400" />
              Gestão de Compras Parceladas & Saldo Devedor
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {filtered.length} parcelamentos {selectedMonthKey ? `em ${selectedMonthLabel}` : 'ativos'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedMonthKey
              ? `Exibindo apenas as compras com parcela agendada para ${selectedMonthLabel}`
              : 'Acompanhe o progresso de quitação, parcelas restantes e mês final de pagamento'}
          </p>
        </div>

        {/* Mini stats cards */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              {selectedMonthKey ? `Compromisso de ${selectedMonthLabel}` : 'Parcela Mensal Atual'}
            </span>
            <span className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              {formatBRL(totalMonthlyCommitment)}
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] uppercase font-semibold text-amber-400 block">
              Saldo Restante Futuro
            </span>
            <span className="text-sm font-bold text-amber-400">
              {formatBRL(totalOutstandingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Month Filter Active Alert Bar */}
      {selectedMonthKey && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Filtro por mês ativado na Linha do Tempo: Exibindo as compras com cobrança em{' '}
              <strong className="text-amber-200 underline">{selectedMonthLabel}</strong> ({filtered.length} parcelas)
            </span>
          </div>
          <button
            onClick={() => onSelectMonthKey?.(null)}
            className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remover filtro de mês</span>
          </button>
        </div>
      )}

      {/* Month quick pills selector */}
      {timeline.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] whitespace-nowrap mr-1">Filtrar por mês:</span>
          <button
            onClick={() => onSelectMonthKey?.(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              !selectedMonthKey
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            Todos os Meses ({installmentTx.length})
          </button>
          {timeline.slice(0, 6).map((m) => (
            <button
              key={m.monthKey}
              onClick={() => onSelectMonthKey?.(selectedMonthKey === m.monthKey ? null : m.monthKey)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                selectedMonthKey === m.monthKey
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {m.monthLabel}
            </button>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por loja ou compra..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Bradesco', 'Itaú', 'Nubank'].map((bank) => (
            <button
              key={bank}
              onClick={() => setFilterBank(bank)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                filterBank === bank
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 light:bg-slate-100 light:text-slate-600'
              }`}
            >
              {bank === 'ALL' ? 'Todos os Bancos' : bank}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 light:border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Estabelecimento / Descrição</th>
              <th className="py-3 px-4">Banco</th>
              <th className="py-3 px-4">Progresso da Compra</th>
              <th className="py-3 px-4">
                {selectedMonthKey ? `Parcela em ${selectedMonthLabel}` : 'Parcela Atual'}
              </th>
              <th className="py-3 px-4">Restantes</th>
              <th className="py-3 px-4 text-right">Valor da Parcela</th>
              <th className="py-3 px-4 text-right">Saldo Devedor Restante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 light:divide-slate-200">
            {filtered.map((t) => {
              const inst = t.installment!;
              
              // Calculate specific installment in this month if filtered
              let currentInMonth = inst.current;
              let isLastInThisMonth = false;
              if (monthOffset !== null && monthOffset > 0) {
                currentInMonth = inst.current + monthOffset;
                isLastInThisMonth = currentInMonth === inst.total;
              }

              const progressPct = Math.round((currentInMonth / inst.total) * 100);
              const remainingAfterCurrent = Math.max(0, inst.total - currentInMonth);
              const remainingTotal = t.amount * inst.remaining;
              const isFinished = inst.remaining === 0;

              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-900 group-hover:text-amber-400 transition-colors">
                      {t.description}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {t.category} • {t.date}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        t.bank === 'Bradesco'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : t.bank === 'Itaú'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      {t.bank}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 min-w-[140px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{currentInMonth} de {inst.total}</span>
                        <span className="font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 light:bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLastInThisMonth || isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-amber-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300 dark:text-slate-300 light:text-slate-700 whitespace-nowrap">
                    {selectedMonthKey ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {currentInMonth}/{inst.total}
                        {isLastInThisMonth && (
                          <span className="text-[10px] text-emerald-400 font-normal ml-1">
                            (Última!)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>{inst.current}/{inst.total}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {selectedMonthKey ? (
                      <span className="text-slate-300 text-[11px]">
                        {remainingAfterCurrent === 0 ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Quita neste mês!
                          </span>
                        ) : (
                          `${remainingAfterCurrent} após ${selectedMonthLabel}`
                        )}
                      </span>
                    ) : isFinished ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Última parcela!
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium text-[11px]">
                        {inst.remaining} {inst.remaining === 1 ? 'parcela' : 'parcelas'}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-white dark:text-white light:text-slate-900 whitespace-nowrap">
                    {formatBRL(t.amount)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-amber-400 whitespace-nowrap">
                    {isFinished ? 'R$ 0,00' : formatBRL(remainingTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhuma compra parcelada encontrada para {selectedMonthLabel || 'os filtros selecionados'}.
          </div>
        )}
      </div>
    </div>
  );
}
