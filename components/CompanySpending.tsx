'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  TrendingUp, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Calendar, 
  Receipt,
  Layers,
  ArrowUpDown,
  Trophy,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { CompanySpend, formatBRL, CATEGORY_COLORS } from '@/lib/invoiceParser';

interface CompanySpendingProps {
  companies: CompanySpend[];
  selectedBank: string | null;
}

export default function CompanySpending({
  companies,
  selectedBank,
}: CompanySpendingProps) {
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState<string>(selectedBank || 'ALL');
  const [sortBy, setSortBy] = useState<'total_desc' | 'count_desc' | 'ticket_desc'>('total_desc');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Filter companies
  const filtered = useMemo(() => {
    return companies
      .filter((c) => {
        if (bankFilter !== 'ALL' && !c.banks.includes(bankFilter)) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            c.banks.some((b) => b.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'count_desc') return b.transactionCount - a.transactionCount;
        if (sortBy === 'ticket_desc') return b.averageTicket - a.averageTicket;
        return b.totalSpent - a.totalSpent;
      });
  }, [companies, bankFilter, search, sortBy]);

  // Overall statistics for Top Podium
  const topSpender = companies[0];
  const mostFrequent = [...companies].sort((a, b) => b.transactionCount - a.transactionCount)[0];
  const highestTicket = [...companies].filter((c) => c.totalSpent > 100).sort((a, b) => b.averageTicket - a.averageTicket)[0];

  const totalFilteredSpent = filtered.reduce((acc, c) => acc + c.totalSpent, 0);
  const maxCompanySpend = companies[0]?.totalSpent || 1;

  const toggleExpand = (name: string) => {
    setExpandedCompany(expandedCompany === name ? null : name);
  };

  return (
    <div className="space-y-6">
      {/* Top Highlights / Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Top Spender */}
        {topSpender && (
          <div className="rounded-2xl border p-5 backdrop-blur-xl border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900/60 to-slate-950/80 light:bg-white light:border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                #1 Maior Gasto Acumulado
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                {topSpender.percentageOfTotal.toFixed(1)}% do total
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white dark:text-white light:text-slate-900 truncate">
                {topSpender.name}
              </h3>
              <div className="text-2xl font-bold text-amber-400">
                {formatBRL(topSpender.totalSpent)}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>{topSpender.transactionCount} lançamentos</span>
              <span className="text-slate-300 font-medium">Méd. {formatBRL(topSpender.averageTicket)}</span>
            </div>
          </div>
        )}

        {/* 2. Most Frequent */}
        {mostFrequent && (
          <div className="rounded-2xl border p-5 backdrop-blur-xl border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-slate-950/80 light:bg-white light:border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-400" />
                Mais Frequente (Transações)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                {mostFrequent.transactionCount} compras
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white dark:text-white light:text-slate-900 truncate">
                {mostFrequent.name}
              </h3>
              <div className="text-2xl font-bold text-indigo-400">
                {formatBRL(mostFrequent.totalSpent)}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Média de {formatBRL(mostFrequent.averageTicket)}/compra</span>
              <span className="text-slate-300 font-medium">{mostFrequent.category}</span>
            </div>
          </div>
        )}

        {/* 3. Highest Ticket */}
        {highestTicket && (
          <div className="rounded-2xl border p-5 backdrop-blur-xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-slate-900/60 to-slate-950/80 light:bg-white light:border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Maior Ticket Médio
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Destaque
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white dark:text-white light:text-slate-900 truncate">
                {highestTicket.name}
              </h3>
              <div className="text-2xl font-bold text-emerald-400">
                {formatBRL(highestTicket.averageTicket)}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Total: {formatBRL(highestTicket.totalSpent)}</span>
              <span className="text-slate-300 font-medium">{highestTicket.category}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Ranking Table Card */}
      <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm space-y-5">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Ranking de Empresas & Estabelecimentos Mais Gastos
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {filtered.length} empresas identificadas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidação de nomes comerciais de todas as faturas (clique em qualquer empresa para ver as compras)
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200 flex items-center gap-3">
            <span className="text-xs text-slate-400">Total filtrado:</span>
            <span className="text-sm font-bold text-amber-400">
              {formatBRL(totalFilteredSpent)}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome da empresa..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Bank selector */}
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todos os Cartões/Bancos</option>
            <option value="Bradesco">Bradesco</option>
            <option value="Itaú">Itaú</option>
            <option value="Nubank">Nubank</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'total_desc' | 'count_desc' | 'ticket_desc')}
            className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-white dark:text-white light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="total_desc">Ordenar por: Maior Valor Total</option>
            <option value="count_desc">Ordenar por: Mais Frequente (Qtd)</option>
            <option value="ticket_desc">Ordenar por: Maior Ticket Médio</option>
          </select>
        </div>

        {/* List of Companies */}
        <div className="space-y-2.5 pt-2">
          {filtered.map((company, index) => {
            const isExpanded = expandedCompany === company.name;
            const rank = index + 1;
            const pctOfTop = Math.round((company.totalSpent / maxCompanySpend) * 100);
            const catColor = CATEGORY_COLORS[company.category] || '#94a3b8';

            let rankBadge = (
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                {rank}
              </span>
            );

            if (rank === 1) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs flex items-center justify-center font-bold">
                  🥇
                </span>
              );
            } else if (rank === 2) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 text-xs flex items-center justify-center font-bold">
                  🥈
                </span>
              );
            } else if (rank === 3) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 text-xs flex items-center justify-center font-bold">
                  🥉
                </span>
              );
            }

            return (
              <div
                key={company.name}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-indigo-500/40 bg-slate-950/80 shadow-lg'
                    : 'border-white/5 hover:border-white/20 bg-slate-950/40 light:bg-slate-50 light:border-slate-200'
                }`}
              >
                {/* Main Row */}
                <div
                  onClick={() => toggleExpand(company.name)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  {/* Left: Rank, Name, Category, Banks */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{rankBadge}</div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 group-hover:text-indigo-400 transition-colors truncate">
                          {company.name}
                        </h4>
                        <span 
                          className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                        >
                          {company.category}
                        </span>
                      </div>

                      {/* Banks and Frequency */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{company.transactionCount} {company.transactionCount === 1 ? 'compra' : 'compras'}</span>
                        <span>•</span>
                        <span>Méd. {formatBRL(company.averageTicket)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {company.banks.map((b) => (
                            <span
                              key={b}
                              className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                                b === 'Bradesco'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : b === 'Itaú'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Bar, Amount, Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    {/* Visual bar */}
                    <div className="hidden lg:flex flex-col items-end gap-1 w-32">
                      <span className="text-[10px] text-slate-400">{company.percentageOfTotal.toFixed(1)}% do orçamento</span>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-500"
                          style={{ width: `${Math.min(100, Math.max(3, pctOfTop))}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-white dark:text-white light:text-slate-900">
                        {formatBRL(company.totalSpent)}
                      </div>
                      <span className="text-[10px] text-indigo-400 font-medium sm:hidden">
                        {company.percentageOfTotal.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: List of all transactions for this company */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-slate-900/50 light:bg-slate-100/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1">
                      <span>Histórico de compras em {company.name} ({company.transactions.length})</span>
                      <span>Valor Individual</span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {company.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="py-2 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {tx.date}
                            </span>
                            <div>
                              <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-medium block">
                                {tx.description}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className={
                                  tx.bank === 'Bradesco' ? 'text-rose-400' : tx.bank === 'Itaú' ? 'text-amber-400' : 'text-purple-400'
                                }>
                                  {tx.bank}
                                </span>
                                {tx.installment && tx.installment.total > 1 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400 font-mono">
                                      Parcela {tx.installment.current}/{tx.installment.total}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="font-bold text-white dark:text-white light:text-slate-900 whitespace-nowrap">
                            {formatBRL(tx.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhuma empresa encontrada com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
