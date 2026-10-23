'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import KpiCards from '@/components/KpiCards';
import BankCards from '@/components/BankCards';
import FutureTimeline from '@/components/FutureTimeline';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import InstallmentsTable from '@/components/InstallmentsTable';
import TransactionsTable from '@/components/TransactionsTable';
import DocumentManager from '@/components/DocumentManager';
import CompanySpending from '@/components/CompanySpending';
import ExternalExpenses, { ExternalExpense, DEFAULT_EXPENSES } from '@/components/ExternalExpenses';
import GlobalExpensesHero from '@/components/GlobalExpensesHero';
import AIEssentialVariableAnalysis from '@/components/AIEssentialVariableAnalysis';
import UploadModal from '@/components/UploadModal';
import { 
  DashboardSummary, 
  ParsedInvoice, 
  formatBRL 
} from '@/lib/invoiceParser';
import { 
  PieChart, 
  Layers, 
  CalendarClock, 
  FileText, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Building2,
  Home as HomeIcon,
  Bot
} from 'lucide-react';

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [invoices, setInvoices] = useState<ParsedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [externalExpenses, setExternalExpenses] = useState<ExternalExpense[]>(DEFAULT_EXPENSES);
  const [externalExpensesTotal, setExternalExpensesTotal] = useState<number>(2411.12);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-analysis' | 'companies' | 'future' | 'external' | 'transactions' | 'documents'>('overview');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync external expenses from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('faturaflow_external_expenses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExternalExpenses(parsed);
          const sum = parsed.reduce((acc: number, e: { amount?: number }) => acc + (Number(e.amount) || 0), 0);
          setExternalExpensesTotal(sum);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/faturas');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
        setSummary(data.summary);
      } else {
        setErrorMessage(data.error || 'Erro ao carregar faturas');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com o servidor';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Handle uploading new file
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/faturas', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        await loadInvoices();
      } else {
        throw new Error(data.error || 'Erro ao processar fatura');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!summary || summary.allTransactions.length === 0) return;

    const headers = ['Data', 'Descricao', 'Banco', 'Categoria', 'Parcela', 'Valor'];
    const rows = summary.allTransactions.map((t) => [
      `"${t.date}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.bank}"`,
      `"${t.category}"`,
      t.installment ? `"${t.installment.current}/${t.installment.total}"` : '"A vista"',
      t.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faturas_lancamentos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Background radial gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRefresh={loadInvoices}
        isLoading={isLoading}
        onExportCsv={handleExportCsv}
        invoicesCount={invoices.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7 z-10">
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={loadInvoices}
              className="underline font-semibold hover:text-white"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !summary && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
                Lendo e processando faturas...
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Extraindo dados de Bradesco, Itaú e Nubank com detecção inteligente de parcelas e valores futuros.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Loaded */}
        {summary && (
          <>
            {/* Espaço Inicial Consolidado: Todos os Gastos (Cartões + Fora do Cartão) */}
            <GlobalExpensesHero
              summary={summary}
              externalTotal={externalExpensesTotal}
              externalExpenses={externalExpenses}
              invoices={invoices}
              onNavigateTab={setActiveTab}
              onSelectBank={(bank) => {
                setSelectedBank(bank);
                setActiveTab('overview');
              }}
            />

            {/* Top KPIs: Current Spent vs Future Commitments */}
            <KpiCards summary={summary} />

            {/* Bank Cards Section */}
            <BankCards
              invoices={invoices}
              selectedBank={selectedBank}
              onSelectBank={setSelectedBank}
            />

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 light:border-slate-200 pb-2 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Visão Geral & Gráficos</span>
                </button>

                <button
                  onClick={() => setActiveTab('ai-analysis')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'ai-analysis'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25'
                      : 'text-slate-400 hover:text-violet-300 hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Análise IA (Essencial vs Variável)</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                    44% / 56%
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('companies')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'companies'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Empresas Mais Gastas</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                    {summary.companySpending?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('future')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'future'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Valores Futuros & Parcelas</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                    {formatBRL(summary.totalFutureCommitted)}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('external')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'external'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Gastos Fora do Cartão</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                    {formatBRL(externalExpensesTotal)}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'transactions'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Todos os Lançamentos</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {summary.totalTransactionsCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'documents'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Leitor & Arquivos ({invoices.length})</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}

            {/* 1. VISÃO GERAL */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sessão da Home: Análise de I.A dos Gastos Essenciais vs Variáveis */}
                <AIEssentialVariableAnalysis
                  summary={summary}
                  externalExpenses={externalExpenses}
                  externalExpensesTotal={externalExpensesTotal}
                  invoices={invoices}
                />

                {/* Future monthly timeline */}
                <FutureTimeline
                  timeline={summary.monthlyTimeline}
                  monthlyCommitments={invoices.flatMap((inv) => inv.futureProjections)}
                  selectedMonthKey={selectedMonthKey}
                  onSelectMonth={(key) => {
                    setSelectedMonthKey(key);
                    if (key) {
                      setActiveTab('future');
                    }
                  }}
                />

                {/* Categories & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdown categories={summary.categoryTotals} />

                  {/* Summary & Bank distribution highlights */}
                  <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        Diagnóstico Financeiro do Mês
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Insights automáticos gerados com base nas faturas de Outubro de 2026
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          69%
                        </div>
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 block">
                            Bradesco concentra o maior volume gasto
                          </span>
                          <p className="text-slate-400">
                            {formatBRL(7936.62)} do total faturado no mês ({formatBRL(summary.totalCurrentSpent)}), além de {formatBRL(3664.55)} em parcelas futuras.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          Nov
                        </div>
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 block">
                            Próxima Fatura estimada em {formatBRL(summary.nextMonthTotal)}
                          </span>
                          <p className="text-slate-400">
                            Uma queda significativa em relação a este mês, trazendo mais fôlego financeiro caso não sejam realizadas novas compras parceladas.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 light:bg-slate-50 light:border-slate-200 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          R$
                        </div>
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 block">
                            Margem de Limite Disponível Segura
                          </span>
                          <p className="text-slate-400">
                            Você possui {formatBRL(summary.totalLimitAvailable)} em limites livres nos três cartões combinados ({formatBRL(summary.totalCombinedLimit)} de teto total).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => setActiveTab('ai-analysis')}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-violet-200 bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-violet-300" />
                        <span>Auditoria I.A</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('companies')}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Empresas</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('future')}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span>Parcelas Futuras</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('external')}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <HomeIcon className="w-4 h-4" />
                        <span>Gastos Fixos</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1.5. ANÁLISE IA (ESSENCIAIS VS VARIÁVEIS) */}
            {activeTab === 'ai-analysis' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <AIEssentialVariableAnalysis
                  summary={summary}
                  externalExpenses={externalExpenses}
                  externalExpensesTotal={externalExpensesTotal}
                  invoices={invoices}
                />
              </div>
            )}

            {/* 2. EMPRESAS MAIS GASTAS */}
            {activeTab === 'companies' && (
              <div className="animate-in fade-in duration-300">
                <CompanySpending
                  companies={summary.companySpending || []}
                  selectedBank={selectedBank}
                />
              </div>
            )}

            {/* 3. VALORES FUTUROS & PARCELAS */}
            {activeTab === 'future' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <FutureTimeline
                  timeline={summary.monthlyTimeline}
                  monthlyCommitments={invoices.flatMap((inv) => inv.futureProjections)}
                  selectedMonthKey={selectedMonthKey}
                  onSelectMonth={setSelectedMonthKey}
                />

                <InstallmentsTable
                  transactions={summary.allTransactions}
                  selectedBank={selectedBank}
                  selectedMonthKey={selectedMonthKey}
                  onSelectMonthKey={setSelectedMonthKey}
                  timeline={summary.monthlyTimeline}
                />
              </div>
            )}

            {/* 4. GASTOS FORA DO CARTÃO (EDITÁVEIS) */}
            {activeTab === 'external' && (
              <div className="animate-in fade-in duration-300">
                <ExternalExpenses
                  creditCardTotal={summary.totalCurrentSpent}
                  expenses={externalExpenses}
                  onExpensesChange={(updated) => {
                    setExternalExpenses(updated);
                    setExternalExpensesTotal(updated.reduce((acc, e) => acc + e.amount, 0));
                  }}
                  onTotalChange={setExternalExpensesTotal}
                />
              </div>
            )}

            {/* 5. TODOS OS LANÇAMENTOS */}
            {activeTab === 'transactions' && (
              <div className="animate-in fade-in duration-300">
                <TransactionsTable
                  transactions={summary.allTransactions}
                  selectedBank={selectedBank}
                  onSelectBank={setSelectedBank}
                />
              </div>
            )}

            {/* 4. LEITOR & ARQUIVOS */}
            {activeTab === 'documents' && (
              <div className="animate-in fade-in duration-300">
                <DocumentManager
                  invoices={invoices}
                  onUploadFile={handleUploadFile}
                  isUploading={isUploading}
                  onRefresh={loadInvoices}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 light:border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>FaturaFlow • Gestão Inteligente de Despesas e Fluxo Futuro</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Documentos analisados localmente com total privacidade e precisão.
        </p>
      </footer>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadFile}
        isUploading={isUploading}
      />
    </div>
  );
}
