'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Home, 
  CalendarClock, 
  ArrowUpRight, 
  Sparkles, 
  PieChart, 
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Droplet,
  Zap,
  Wifi,
  Building,
  GraduationCap,
  Landmark,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatBRL, DashboardSummary, ParsedInvoice } from '@/lib/invoiceParser';
import { ExternalExpense } from '@/components/ExternalExpenses';

interface GlobalExpensesHeroProps {
  summary: DashboardSummary;
  externalTotal: number;
  externalExpenses?: ExternalExpense[];
  invoices: ParsedInvoice[];
  onNavigateTab: (tab: 'overview' | 'ai-analysis' | 'companies' | 'future' | 'external' | 'transactions' | 'documents') => void;
  onSelectBank?: (bank: string | null) => void;
}

export default function GlobalExpensesHero({
  summary,
  externalTotal,
  externalExpenses = [],
  invoices,
  onNavigateTab,
  onSelectBank,
}: GlobalExpensesHeroProps) {
  const [showDetailedList, setShowDetailedList] = useState(false);

  const creditCardTotal = summary.totalCurrentSpent;
  const grandTotal = creditCardTotal + externalTotal;

  // Percentage calculations
  const cardPct = grandTotal > 0 ? (creditCardTotal / grandTotal) * 100 : 0;
  const externalPct = grandTotal > 0 ? (externalTotal / grandTotal) * 100 : 0;

  // Bank amounts
  const bradescoTotal = invoices.find((i) => i.bank === 'Bradesco')?.totalCurrent || 0;
  const itauTotal = invoices.find((i) => i.bank === 'Itaú')?.totalCurrent || 0;
  const nubankTotal = invoices.find((i) => i.bank === 'Nubank')?.totalCurrent || 0;
  const caixaTotal = invoices.find((i) => i.bank === 'Caixa')?.totalCurrent || 0;

  const bradescoPct = grandTotal > 0 ? (bradescoTotal / grandTotal) * 100 : 0;
  const itauPct = grandTotal > 0 ? (itauTotal / grandTotal) * 100 : 0;
  const nubankPct = grandTotal > 0 ? (nubankTotal / grandTotal) * 100 : 0;
  const caixaPct = grandTotal > 0 ? (caixaTotal / grandTotal) * 100 : 0;

  // External breakdown status
  const paidExternal = externalExpenses.filter((e) => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const pendingExternal = externalExpenses.filter((e) => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const paidCount = externalExpenses.filter((e) => e.status === 'paid').length;
  const pendingCount = externalExpenses.filter((e) => e.status === 'pending').length;

  const getIconForExpense = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('água') || n.includes('agua')) return <Droplet className="w-3.5 h-3.5 text-cyan-400" />;
    if (n.includes('luz') || n.includes('energia')) return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    if (n.includes('internet') || n.includes('wifi')) return <Wifi className="w-3.5 h-3.5 text-blue-400" />;
    if (n.includes('condom') || n.includes('financiamento')) return <Building className="w-3.5 h-3.5 text-indigo-400" />;
    if (n.includes('inglês') || n.includes('ingles') || n.includes('curso') || n.includes('faculdade')) return <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />;
    if (n.includes('iptu') || n.includes('imposto')) return <Landmark className="w-3.5 h-3.5 text-rose-400" />;
    return <Receipt className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 shadow-2xl border-white/10 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950 light:bg-white light:border-slate-200 light:shadow-md">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/15 via-rose-500/10 to-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10 space-y-6">
        {/* Header & Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white dark:text-white light:text-slate-900">
                  Espaço Unificado de Gastos
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Mês Vigente: Outubro / 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-0.5">
                Visão centralizada: Faturas de cartões de crédito (Bradesco, Itaú, Nubank) + despesas fixas fora do cartão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetailedList(!showDetailedList)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 light:bg-slate-100 light:text-slate-700 light:border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {showDetailedList ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ocultar Detalhes</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ver Todos os Gastos</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateTab('ai-analysis');
                const el = document.getElementById('ai-essential-variable-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-300 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-violet-500/20"
              title="Ver análise da Inteligência Artificial sobre gastos essenciais e variáveis"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Análise I.A (44% Essenciais / 56% Variáveis)</span>
            </button>

            <button
              onClick={() => onNavigateTab('external')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Gerenciar Contas Fora</span>
            </button>
          </div>
        </div>

        {/* Master Total Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1 pb-1">
          {/* Big Number */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Gasto Total Consolidado do Mês
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white dark:text-white light:text-slate-900 flex items-baseline gap-2">
              <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 dark:from-white dark:via-slate-100 dark:to-indigo-200 light:from-slate-900 light:to-indigo-900 bg-clip-text text-transparent">
                {formatBRL(grandTotal)}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center flex-wrap gap-1.5">
              <span className="text-rose-400 font-semibold">{formatBRL(creditCardTotal)}</span> em cartões ({cardPct.toFixed(1)}%)
              <span>+</span>
              <span className="text-amber-400 font-semibold">{formatBRL(externalTotal)}</span> fora do cartão ({externalPct.toFixed(1)}%)
            </p>
          </div>

          {/* Comparative Balance Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Cartões de Crédito */}
            <div 
              onClick={() => onNavigateTab('overview')}
              className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-rose-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                    Faturas dos Cartões ({invoices.length})
                  </span>
                  <span className="text-xs font-bold text-rose-400">{cardPct.toFixed(1)}% do total</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
                  {formatBRL(creditCardTotal)}
                </div>
              </div>

              {/* Sub-card bank mini pills */}
              <div className="mt-4 pt-3 border-t border-rose-500/15 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Bradesco
                  </span>
                  <span className="font-semibold text-rose-200">{formatBRL(bradescoTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Itaú
                  </span>
                  <span className="font-semibold text-amber-200">{formatBRL(itauTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Nubank
                  </span>
                  <span className="font-semibold text-purple-200">{formatBRL(nubankTotal)}</span>
                </div>
                {caixaTotal > 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Caixa (Eliton Nunes)
                    </span>
                    <span className="font-semibold text-blue-300">{formatBRL(caixaTotal)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Fora do Cartão */}
            <div 
              onClick={() => onNavigateTab('external')}
              className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-amber-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    Gastos Fora do Cartão ({externalExpenses.length})
                  </span>
                  <span className="text-xs font-bold text-amber-400">{externalPct.toFixed(1)}% do total</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
                  {formatBRL(externalTotal)}
                </div>
              </div>

              {/* Status pills & highlights */}
              <div className="mt-4 pt-3 border-t border-amber-500/15 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Pendentes ({pendingCount})
                  </span>
                  <span className="font-semibold text-amber-300">{formatBRL(pendingExternal)}</span>
                </div>
                {paidCount > 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Pagas ({paidCount})
                    </span>
                    <span className="font-semibold text-emerald-400">{formatBRL(paidExternal)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-amber-300/80 group-hover:text-amber-300 pt-1">
                  <span>Água, Luz, Internet, Moradia...</span>
                  <span className="font-medium group-hover:translate-x-0.5 transition-transform">Editar valores →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Proportional Split Bar */}
        <div className="space-y-2 pt-2 border-t border-white/5 light:border-slate-100">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-400 text-[11px] font-medium">Distribuição proporcional das saídas deste mês:</span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Bradesco ({bradescoPct.toFixed(0)}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Itaú ({itauPct.toFixed(0)}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Nubank ({nubankPct.toFixed(0)}%)</span>
              </span>
              {caixaTotal > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Caixa ({caixaPct.toFixed(0)}%)</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span>Fora do Cartão ({externalPct.toFixed(0)}%)</span>
              </span>
            </div>
          </div>

          <div className="w-full h-3.5 rounded-full bg-slate-900/90 overflow-hidden flex shadow-inner border border-white/5">
            <div 
              className="bg-rose-500 h-full transition-all duration-700 hover:brightness-110" 
              style={{ width: `${bradescoPct}%` }}
              title={`Bradesco: ${formatBRL(bradescoTotal)} (${bradescoPct.toFixed(1)}%)`}
            ></div>
            <div 
              className="bg-amber-500 h-full transition-all duration-700 hover:brightness-110" 
              style={{ width: `${itauPct}%` }}
              title={`Itaú: ${formatBRL(itauTotal)} (${itauPct.toFixed(1)}%)`}
            ></div>
            <div 
              className="bg-purple-500 h-full transition-all duration-700 hover:brightness-110" 
              style={{ width: `${nubankPct}%` }}
              title={`Nubank: ${formatBRL(nubankTotal)} (${nubankPct.toFixed(1)}%)`}
            ></div>
            {caixaTotal > 0 && (
              <div 
                className="bg-blue-500 h-full transition-all duration-700 hover:brightness-110" 
                style={{ width: `${caixaPct}%` }}
                title={`Caixa: ${formatBRL(caixaTotal)} (${caixaPct.toFixed(1)}%)`}
              ></div>
            )}
            <div 
              className="bg-yellow-400 h-full transition-all duration-700 hover:brightness-110" 
              style={{ width: `${externalPct}%` }}
              title={`Fora do Cartão: ${formatBRL(externalTotal)} (${externalPct.toFixed(1)}%)`}
            ></div>
          </div>
        </div>

        {/* Quick Context Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Contas de Consumo (Água + Luz)
            </span>
            <span className="text-sm sm:text-base font-bold text-white dark:text-white light:text-slate-900 mt-0.5 block">
              {formatBRL(
                externalExpenses
                  .filter((e) => e.category === 'Contas de Consumo')
                  .reduce((acc, e) => acc + e.amount, 0) || 907.00
              )}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Água (R$ 177) + Luz (R$ 730)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Moradia (Cond. + Financiamento)
            </span>
            <span className="text-sm sm:text-base font-bold text-white dark:text-white light:text-slate-900 mt-0.5 block">
              {formatBRL(
                externalExpenses
                  .filter((e) => e.category === 'Moradia')
                  .reduce((acc, e) => acc + e.amount, 0) || 822.22
              )}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cond. (R$ 287,22) + Finan. (R$ 535)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Telecom, Educação & IPTU
            </span>
            <span className="text-sm sm:text-base font-bold text-white dark:text-white light:text-slate-900 mt-0.5 block">
              {formatBRL(
                externalExpenses
                  .filter((e) => !['Contas de Consumo', 'Moradia'].includes(e.category))
                  .reduce((acc, e) => acc + e.amount, 0) || 681.90
              )}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Internet, Inglês e IPTU</span>
          </div>

          <div 
            onClick={() => onNavigateTab('future')}
            className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-semibold text-indigo-400 block flex items-center justify-between">
              <span>Parcelas Futuras (Cartão)</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-sm sm:text-base font-bold text-indigo-300 mt-0.5 block">
              {formatBRL(summary.totalFutureCommitted)}
            </span>
            <span className="text-[10px] text-indigo-400/80 block mt-0.5">Saldo devedor parcelado</span>
          </div>
        </div>

        {/* Detailed Drawer (Expandable) showing every bill + card */}
        {showDetailedList && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Detalhamento Completo de Todas as Saídas do Mês (10 Itens)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Total: <strong className="text-white">{formatBRL(grandTotal)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Cartões */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-rose-300 block uppercase">
                  Cartões de Crédito ({invoices.length} Faturas):
                </span>
                <div className="space-y-1.5">
                  {invoices.map((inv) => (
                    <div 
                      key={inv.bank}
                      onClick={() => {
                        onSelectBank?.(inv.bank);
                        onNavigateTab('overview');
                      }}
                      className="p-3 rounded-xl bg-slate-950/70 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                          inv.bank === 'Bradesco' ? 'bg-rose-600' :
                          inv.bank === 'Itaú' ? 'bg-amber-600' :
                          inv.bank === 'Nubank' ? 'bg-purple-600' : 'bg-blue-600'
                        }`}>
                          {inv.bank[0]}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors block">
                            Fatura {inv.bank}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {inv.transactions.length} lançamentos
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">
                          {formatBRL(inv.totalCurrent)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {((inv.totalCurrent / grandTotal) * 100).toFixed(1)}% do total
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Contas Fora do Cartão */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-300 block uppercase">
                    Contas Fora do Cartão ({externalExpenses.length} Despesas):
                  </span>
                  <button 
                    onClick={() => onNavigateTab('external')}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Editar / Adicionar
                  </button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {externalExpenses.map((exp) => (
                    <div 
                      key={exp.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                          {getIconForExpense(exp.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">
                              {exp.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                              exp.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {exp.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {exp.category} {exp.dueDateDay ? `• Vencimento dia ${exp.dueDateDay}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-300 block">
                          {formatBRL(exp.amount)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {((exp.amount / grandTotal) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
