'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CreditCard, 
  Calendar, 
  Tag, 
  Layers, 
  Download,
  Clock,
  Sparkles
} from 'lucide-react';
import { Transaction, formatBRL, CATEGORY_COLORS } from '@/lib/invoiceParser';

interface TransactionsTableProps {
  transactions: Transaction[];
  selectedBank: string | null;
  onSelectBank: (b: string | null) => void;
}

export default function TransactionsTable({
  transactions,
  selectedBank,
  onSelectBank,
}: TransactionsTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PARCELED' | 'ONE_OFF'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount_desc' | 'amount_asc'>('date');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedBank && t.bank !== selectedBank) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (typeFilter === 'PARCELED' && (!t.installment || t.installment.total <= 1)) return false;
      if (typeFilter === 'ONE_OFF' && t.installment && t.installment.total > 1) return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.bank.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0; // Default order is document order
    });
  }, [transactions, selectedBank, categoryFilter, typeFilter, search, sortBy]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalFilteredAmount = useMemo(() => {
    return filtered.reduce((acc, t) => acc + t.amount, 0);
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  return (
    <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm space-y-5">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Lançamentos & Gastos Realizados
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {filtered.length} lançamentos encontrados
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize todos os itens presentes nas faturas lidas com classificação detalhada
          </p>
        </div>

        {/* Filter total */}
        <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200 flex items-center gap-3">
          <span className="text-xs text-slate-400">Total filtrado:</span>
          <span className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            {formatBRL(totalFilteredAmount)}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por descrição..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Bank Selector */}
        <select
          value={selectedBank || 'ALL'}
          onChange={(e) => {
            onSelectBank(e.target.value === 'ALL' ? null : e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="ALL">Todos os Cartões/Bancos</option>
          <option value="Bradesco">Bradesco</option>
          <option value="Itaú">Itaú</option>
          <option value="Nubank">Nubank</option>
        </select>

        {/* Category Selector */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="ALL">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'amount_desc' | 'amount_asc')}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="date">Ordem da Fatura</option>
          <option value="amount_desc">Maior Valor primeiro</option>
          <option value="amount_asc">Menor Valor primeiro</option>
        </select>
      </div>

      {/* Type pill filters (À vista vs Parcelado) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 text-[11px]">Tipo de cobrança:</span>
        <button
          onClick={() => { setTypeFilter('ALL'); setPage(1); }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            typeFilter === 'ALL'
              ? 'bg-slate-800 text-white border border-white/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Todos ({transactions.length})
        </button>
        <button
          onClick={() => { setTypeFilter('PARCELED'); setPage(1); }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
            typeFilter === 'PARCELED'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-amber-400'
          }`}
        >
          <Clock className="w-3 h-3" />
          Apenas Parcelados
        </button>
        <button
          onClick={() => { setTypeFilter('ONE_OFF'); setPage(1); }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            typeFilter === 'ONE_OFF'
              ? 'bg-slate-800 text-white border border-white/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Compras À Vista
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-xl border border-white/5 light:border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Descrição do Lançamento</th>
              <th className="py-3 px-4">Banco / Cartão</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Parcelamento</th>
              <th className="py-3 px-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 light:divide-slate-200">
            {paginated.map((t) => {
              const isPayment = t.category === 'Pagamentos & Créditos' || t.amount < 0;
              const hasInstallment = t.installment && t.installment.total > 1;
              const catColor = CATEGORY_COLORS[t.category] || '#94a3b8';

              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {t.date}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-200 dark:text-slate-200 light:text-slate-900 group-hover:text-indigo-400 transition-colors">
                    {t.description}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
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

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-medium"
                      style={{ backgroundColor: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }}></span>
                      {t.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {hasInstallment ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5" />
                        {t.installment!.current}/{t.installment!.total}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">
                        À vista
                      </span>
                    )}
                  </td>

                  <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                    isPayment ? 'text-emerald-400' : 'text-white dark:text-white light:text-slate-900'
                  }`}>
                    {isPayment ? `- ${formatBRL(Math.abs(t.amount))}` : formatBRL(t.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Página {page} de {totalPages} ({filtered.length} itens)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/60 light:bg-slate-100 disabled:opacity-40 hover:bg-slate-800"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/60 light:bg-slate-100 disabled:opacity-40 hover:bg-slate-800"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
