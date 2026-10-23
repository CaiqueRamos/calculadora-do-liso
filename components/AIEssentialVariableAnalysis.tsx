'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Cpu, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  Layers, 
  DollarSign, 
  Wallet, 
  CreditCard, 
  ShoppingBag, 
  Utensils, 
  Car, 
  HeartPulse, 
  Gamepad2, 
  Film, 
  RotateCcw, 
  Info,
  Bot
} from 'lucide-react';
import { DashboardSummary, ParsedInvoice, formatBRL } from '@/lib/invoiceParser';
import { ExternalExpense } from '@/components/ExternalExpenses';
import { 
  ExpenseNature, 
  runAICardExpenseAnalysis, 
  AIClassifiedTransaction 
} from '@/lib/aiExpenseClassifier';

interface AIEssentialVariableAnalysisProps {
  summary: DashboardSummary;
  externalExpenses?: ExternalExpense[];
  externalExpensesTotal?: number;
  invoices?: ParsedInvoice[];
}

const STORAGE_KEY = 'faturaflow_ai_classification_overrides_v1';

export default function AIEssentialVariableAnalysis({
  summary,
  externalExpenses = [],
  externalExpensesTotal = 0,
  invoices = [],
}: AIEssentialVariableAnalysisProps) {
  // Config & Scope states
  const [scope, setScope] = useState<'cards_only' | 'cards_plus_external'>('cards_only');
  const [transportAsEssential, setTransportAsEssential] = useState<boolean>(true);
  const [userOverrides, setUserOverrides] = useState<Record<string, ExpenseNature>>({});
  const [selectedSavingsPercent, setSelectedSavingsPercent] = useState<number>(25);

  // Filter & Search states for the interactive transaction list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNature, setFilterNature] = useState<'all' | 'essential' | 'variable'>('all');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [showTransactionDrawer, setShowTransactionDrawer] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overview' | 'categories' | 'banks' | 'simulator'>('overview');

  // Load manual overrides from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setUserOverrides(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save overrides to localStorage
  const handleToggleOverride = (txId: string, currentNature: ExpenseNature) => {
    const nextNature: ExpenseNature = currentNature === 'essential' ? 'variable' : 'essential';
    const nextOverrides = {
      ...userOverrides,
      [txId]: nextNature,
    };
    setUserOverrides(nextOverrides);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOverrides));
    } catch {
      // ignore
    }
  };

  const handleResetOverrides = () => {
    setUserOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Run the AI classification computation
  const analysis = useMemo(() => {
    return runAICardExpenseAnalysis({
      transactions: summary.allTransactions,
      invoices,
      includeExternal: scope === 'cards_plus_external',
      externalExpenses,
      transportAsEssential,
      userOverrides,
    });
  }, [summary.allTransactions, invoices, scope, externalExpenses, transportAsEssential, userOverrides]);

  // Filtered transactions for the audit drawer
  const filteredTransactions = useMemo(() => {
    return analysis.classifiedTransactions.filter((tx) => {
      // Filter by nature
      if (filterNature !== 'all' && tx.classification !== filterNature) {
        return false;
      }
      // Filter by bank
      if (filterBank !== 'all' && tx.bank !== filterBank) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(q);
        const catMatch = tx.category.toLowerCase().includes(q);
        const bankMatch = tx.bank.toLowerCase().includes(q);
        if (!descMatch && !catMatch && !bankMatch) return false;
      }
      return true;
    });
  }, [analysis.classifiedTransactions, filterNature, filterBank, searchQuery]);

  // Dynamic simulated savings calculation
  const calculatedSavings = useMemo(() => {
    const monthly = analysis.variableTotal * (selectedSavingsPercent / 100);
    const annual = monthly * 12;
    return { monthly, annual };
  }, [analysis.variableTotal, selectedSavingsPercent]);

  const overridesCount = Object.keys(userOverrides).length;

  return (
    <section 
      id="ai-essential-variable-section" 
      className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 shadow-2xl border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 light:bg-white light:border-indigo-200 light:shadow-xl"
    >
      {/* Decorative ambient glowing lights */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[120px] pointer-events-none -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -mr-20 -mb-20"></div>
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -ml-20"></div>

      <div className="relative z-10 space-y-7">
        
        {/* =================================================================== */}
        {/* 1. SECTION HEADER: AI BRANDING & SCOPE SWITCHERS                   */}
        {/* =================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 light:border-slate-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 p-0.5 shadow-xl shadow-indigo-600/25 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-white backdrop-blur-sm">
                <Bot className="w-7 h-7 text-violet-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  Auditoria de Inteligência Artificial
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {analysis.classifiedTransactions.length} lançamentos analisados
                </span>
                {overridesCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    ✏️ {overridesCount} {overridesCount === 1 ? 'ajuste manual' : 'ajustes manuais'}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white dark:text-white light:text-slate-900 mt-1">
                Gastos Essenciais vs. Gastos Variáveis do Cartão
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 max-w-2xl">
                Nossa I.A categorizou os gastos das suas faturas em necessidades vitais (alimentação básica, farmácia, transporte) versus estilo de vida flexível (restaurantes, delivery, varejo e lazer).
              </p>
            </div>
          </div>

          {/* Quick controls: Scope & Transport mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scope Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-950/70 border border-white/10 light:bg-slate-100 light:border-slate-300">
              <button
                onClick={() => setScope('cards_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  scope === 'cards_only'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white light:text-slate-600'
                }`}
                title="Avaliar apenas os gastos de cartões de crédito"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Apenas Cartão</span>
              </button>
              <button
                onClick={() => setScope('cards_plus_external')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  scope === 'cards_plus_external'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white light:text-slate-600'
                }`}
                title="Incluir despesas fixas da casa fora do cartão (Água, Luz, Financiamento, etc.)"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Cartão + Contas Fora</span>
              </button>
            </div>

            {/* Transport Sensitivity Switcher */}
            <button
              onClick={() => setTransportAsEssential(!transportAsEssential)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 light:bg-slate-100 light:text-slate-700 light:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Alternar se Uber/99 é considerado Essencial (trabalho) ou Variável (conforto)"
            >
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Uber/99: <strong>{transportAsEssential ? 'Essencial' : 'Variável'}</strong></span>
            </button>

            {overridesCount > 0 && (
              <button
                onClick={handleResetOverrides}
                className="px-2.5 py-2 rounded-xl text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                title="Restaurar classificação original da I.A"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar I.A</span>
              </button>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. MAIN PERCENTAGE SPLIT HERO CARDS                                */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* CARD A: GASTOS ESSENCIAIS */}
          <div className="relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 group border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-slate-950 light:bg-white light:border-emerald-200 light:shadow-sm">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    Gastos Essenciais
                  </span>
                  <p className="text-[10px] text-slate-400">Necessidades indispensáveis</p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {analysis.essentialCount} despesas
              </span>
            </div>

            <div className="space-y-1 mb-5">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400">
                  {analysis.essentialPct.toFixed(1)}%
                </span>
                <span className="text-sm font-semibold text-slate-400">da fatura</span>
              </div>
              <div className="text-2xl font-bold text-white dark:text-white light:text-slate-900">
                {formatBRL(analysis.essentialTotal)}
              </div>
            </div>

            {/* Top essential items summary */}
            <div className="pt-4 border-t border-emerald-500/15 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Composição dos Essenciais:
              </span>
              <div className="space-y-1.5">
                {analysis.topEssentialCategories.slice(0, 4).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {formatBRL(cat.total)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold w-10 text-right">
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                <strong>Regra 50/30/20:</strong> O recomendado é manter necessidades essenciais em até <strong>50%</strong>. Seus {analysis.essentialPct.toFixed(1)}% estão <strong>perfeitamente equilibrados</strong>.
              </span>
            </div>
          </div>

          {/* CARD B: GASTOS VARIÁVEIS / SUPÉRFLUOS */}
          <div className="relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 group border-rose-500/25 bg-gradient-to-br from-rose-950/30 via-slate-900/80 to-slate-950 light:bg-white light:border-rose-200 light:shadow-sm">
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    Gastos Variáveis & Estilo de Vida
                  </span>
                  <p className="text-[10px] text-slate-400">Despesas discricionárias / flexíveis</p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {analysis.variableCount} despesas
              </span>
            </div>

            <div className="space-y-1 mb-5">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-rose-400">
                  {analysis.variablePct.toFixed(1)}%
                </span>
                <span className="text-sm font-semibold text-slate-400">da fatura</span>
              </div>
              <div className="text-2xl font-bold text-white dark:text-white light:text-slate-900">
                {formatBRL(analysis.variableTotal)}
              </div>
            </div>

            {/* Top variable items summary */}
            <div className="pt-4 border-t border-rose-500/15 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Maiores Drenos Variáveis:
              </span>
              <div className="space-y-1.5">
                {analysis.topVariableCategories.slice(0, 4).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {formatBRL(cat.total)}
                      </span>
                      <span className="text-[10px] text-rose-400 font-bold w-10 text-right">
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                <strong>Oportunidade de Ouro:</strong> Com {analysis.variablePct.toFixed(1)}% em variáveis, você tem mais de <strong>{formatBRL(analysis.variableTotal)}</strong> em compras que podem ser reduzidas imediatamente para gerar economia expressiva.
              </span>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 3. DUAL PROGRESS BAR & BENCHMARK 50/30/20                           */}
        {/* =================================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-white/10 light:bg-slate-50 light:border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                Balanço Proporcional das Faturas
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {analysis.essentialPct.toFixed(1)}% Essenciais ({formatBRL(analysis.essentialTotal)})
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                {analysis.variablePct.toFixed(1)}% Variáveis ({formatBRL(analysis.variableTotal)})
              </span>
            </div>
          </div>

          {/* Visual Dual Progress Bar */}
          <div className="relative w-full h-5 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${analysis.essentialPct}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
            >
              {analysis.essentialPct > 15 && `${analysis.essentialPct.toFixed(0)}%`}
            </div>
            <div 
              style={{ width: `${analysis.variablePct}%` }}
              className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
            >
              {analysis.variablePct > 15 && `${analysis.variablePct.toFixed(0)}%`}
            </div>
          </div>

          {/* Golden Rule 50/30/20 Guide Footnote */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 gap-2">
            <span className="flex items-center gap-1">
              <span>🎯 Meta Padrão Metodologia 50/30/20:</span>
              <span className="text-emerald-300 font-semibold">50% Essenciais</span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">30% Estilo de Vida</span>
              <span>•</span>
              <span className="text-indigo-300 font-semibold">20% Investimentos</span>
            </span>
            <span className="text-slate-300 dark:text-slate-300 light:text-slate-600 font-medium">
              Base de cálculo total: <strong>{formatBRL(analysis.totalAnalyzed)}</strong>
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. SUB-TABS: DIAGNÓSTICO IA, CATEGORIAS, BANCOS, SIMULADOR         */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 border-b border-white/10 light:border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveAnalysisTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeAnalysisTab === 'overview'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 light:text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diagnóstico & Parecer da IA</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeAnalysisTab === 'simulator'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 light:text-slate-600'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Simulador de Economia</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
              Novo
            </span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('banks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeAnalysisTab === 'banks'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 light:text-slate-600'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Divisão por Banco</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeAnalysisTab === 'categories'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 light:text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas as Categorias</span>
          </button>
        </div>

        {/* TAB 1: DIAGNÓSTICO DA IA */}
        {activeAnalysisTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-violet-500/20 light:bg-slate-50 light:border-slate-200 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  {analysis.aiDiagnosis.badge}
                </span>
                <h4 className="text-base font-extrabold text-white dark:text-white light:text-slate-900 mt-1">
                  {analysis.aiDiagnosis.title}
                </h4>
                <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                  {analysis.aiDiagnosis.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Destaques */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 light:bg-white light:border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    Pontos Críticos Identificados:
                  </span>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    {analysis.aiDiagnosis.highlights.map((h, i) => (
                      <li key={i} className="leading-snug">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plano de Ação */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 light:bg-white light:border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Recomendações Práticas da I.A:
                  </span>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    {analysis.aiDiagnosis.actionTips.map((tip, i) => (
                      <li key={i} className="leading-snug">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULADOR DE ECONOMIA */}
        {activeAnalysisTab === 'simulator' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-950 border border-indigo-500/20 light:bg-slate-50 light:border-slate-200 space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-extrabold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Simulador de Resgate Financeiro com I.A
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Veja quanto dinheiro você recupera todo mês ao reduzir despesas supérfluas e variáveis.
                </p>
              </div>

              {/* Selector Presets */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 light:bg-white">
                {[15, 25, 35, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSelectedSavingsPercent(pct)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedSavingsPercent === pct
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white light:text-slate-600'
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Big Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Economia Mensal Estimada (-{selectedSavingsPercent}%)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
                  {formatBRL(calculatedSavings.monthly)}
                </div>
                <p className="text-xs text-emerald-300/80">
                  Mais de <strong>{formatBRL(calculatedSavings.monthly)}</strong> livres na sua conta todo mês.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  Impacto Acumulado em 1 Ano
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
                  {formatBRL(calculatedSavings.annual)}
                </div>
                <p className="text-xs text-indigo-300/80">
                  Capital suficiente para quitar dívidas, criar reserva ou viajar sem dívidas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIVISÃO POR BANCO */}
        {activeAnalysisTab === 'banks' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.byBank.map((b) => (
                <div 
                  key={b.bank}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 light:bg-slate-50 light:border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      {b.bank}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {b.transactionsCount} txs
                    </span>
                  </div>

                  <div className="text-lg font-extrabold text-white dark:text-white light:text-slate-900">
                    {formatBRL(b.total)}
                  </div>

                  {/* Micro progress bar for this bank */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div 
                        style={{ width: `${b.essentialPct}%` }}
                        className="h-full bg-emerald-500"
                        title={`Essencial: ${b.essentialPct.toFixed(1)}%`}
                      ></div>
                      <div 
                        style={{ width: `${b.variablePct}%` }}
                        className="h-full bg-rose-500"
                        title={`Variável: ${b.variablePct.toFixed(1)}%`}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="text-emerald-400 font-bold">{b.essentialPct.toFixed(0)}% Essencial</span>
                      <span className="text-rose-400 font-bold">{b.variablePct.toFixed(0)}% Variável</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TODAS AS CATEGORIAS */}
        {activeAnalysisTab === 'categories' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Essenciais */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Categorias Essenciais ({analysis.topEssentialCategories.length})
                </span>
                <div className="space-y-2">
                  {analysis.topEssentialCategories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-white/5">
                      <div>
                        <span className="font-semibold text-slate-200">{c.category}</span>
                        <span className="text-[10px] text-slate-500 block">{c.count} lançamentos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white block">{formatBRL(c.total)}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">{c.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variáveis */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Categorias Variáveis / Estilo de Vida ({analysis.topVariableCategories.length})
                </span>
                <div className="space-y-2">
                  {analysis.topVariableCategories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-white/5">
                      <div>
                        <span className="font-semibold text-slate-200">{c.category}</span>
                        <span className="text-[10px] text-slate-500 block">{c.count} lançamentos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white block">{formatBRL(c.total)}</span>
                        <span className="text-[10px] text-rose-400 font-semibold">{c.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. INTERACTIVE AUDIT DRAWER (SEARCH & TOGGLE OVERRIDES)             */}
        {/* =================================================================== */}
        <div className="pt-2">
          <button
            onClick={() => setShowTransactionDrawer(!showTransactionDrawer)}
            className="w-full py-3.5 px-4 rounded-2xl border border-white/10 bg-slate-950/60 hover:bg-slate-900 text-slate-200 light:bg-slate-100 light:text-slate-800 light:border-slate-300 transition-all flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-400" />
              <span>
                {showTransactionDrawer ? 'Ocultar Auditoria Detalhada dos Lançamentos' : 'Auditar e Ajustar Lançamentos com I.A'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold">
                {analysis.classifiedTransactions.length} itens classificados
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400 group-hover:text-white">
              <span>{showTransactionDrawer ? 'Fechar lista' : 'Ver todos os 261 lançamentos'}</span>
              {showTransactionDrawer ? (
                <ChevronUp className="w-4 h-4 text-violet-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-violet-400" />
              )}
            </div>
          </button>

          {/* Expanded Drawer */}
          {showTransactionDrawer && (
            <div className="mt-4 p-5 rounded-2xl border border-white/10 bg-slate-950/90 light:bg-white light:border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Search and Filters toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar estabelecimento, categoria ou banco..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 light:bg-slate-100 light:text-slate-900 light:border-slate-300"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFilterNature('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      filterNature === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({analysis.classifiedTransactions.length})
                  </button>

                  <button
                    onClick={() => setFilterNature('essential')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                      filterNature === 'essential'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Essenciais ({analysis.essentialCount})
                  </button>

                  <button
                    onClick={() => setFilterNature('variable')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                      filterNature === 'variable'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Variáveis ({analysis.variableCount})
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isEssential = tx.classification === 'essential';

                    return (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isEssential
                            ? 'bg-slate-900/50 border-emerald-500/20 hover:border-emerald-500/40'
                            : 'bg-slate-900/50 border-rose-500/20 hover:border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isEssential
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {isEssential ? 'ESS' : 'VAR'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white dark:text-white light:text-slate-900">
                                {tx.description}
                              </span>
                              {tx.isUserOverridden && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  ✏️ Modificado por você
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap mt-0.5">
                              <span className="text-slate-300 font-medium">{tx.bank}</span>
                              <span>•</span>
                              <span>{tx.category}</span>
                              <span>•</span>
                              <span className="text-[10px] text-slate-500 italic max-w-sm truncate" title={tx.reason}>
                                {tx.reason}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & 1-Click Toggle Override */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-white dark:text-white light:text-slate-900 block">
                              {formatBRL(tx.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {tx.date}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleOverride(tx.id, tx.classification)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                              isEssential
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
                            }`}
                            title={isEssential ? 'Clique para mudar para Variável' : 'Clique para mudar para Essencial'}
                          >
                            {isEssential ? 'Mudar p/ Variável' : 'Mudar p/ Essencial'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer info in drawer */}
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5">
                <span>
                  Exibindo <strong>{filteredTransactions.length}</strong> de {analysis.classifiedTransactions.length} lançamentos
                </span>
                <span>
                  Os ajustes manuais são salvos automaticamente no seu navegador.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
