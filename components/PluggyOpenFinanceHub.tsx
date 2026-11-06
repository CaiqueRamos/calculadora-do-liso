'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Landmark,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Lock,
  ExternalLink,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import {
  OpenFinanceDashboardData,
  OpenFinanceTransaction,
} from '@/lib/pluggyClient';
import { formatBRL } from '@/lib/invoiceParser';
import type { PluggyConnectProps } from 'react-pluggy-connect';

// Carrega o widget oficial da Pluggy apenas no cliente (evita problemas de SSR com zoid/window)
const PluggyConnectWidget = dynamic<PluggyConnectProps>(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false }
);

interface PluggyOpenFinanceHubProps {
  onImportTransactionAsExternal?: (tx: OpenFinanceTransaction) => void;
}

const STORAGE_ITEMS_KEY = 'faturaflow_pluggy_items_v1';
const STORAGE_CREDS_KEY = 'faturaflow_pluggy_creds_v1';

export default function PluggyOpenFinanceHub({
  onImportTransactionAsExternal,
}: PluggyOpenFinanceHubProps) {
  const [data, setData] = useState<OpenFinanceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Saved item IDs & optional custom API credentials
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [includeSandbox, setIncludeSandbox] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Filters & UI states
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'accounts' | 'transactions' | 'investments'>('overview');
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Load saved items and credentials from localStorage on mount
  useEffect(() => {
    try {
      const rawItems = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (rawItems) {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) setSavedItemIds(parsed);
      }
      const rawCreds = localStorage.getItem(STORAGE_CREDS_KEY);
      if (rawCreds) {
        const parsedCreds = JSON.parse(rawCreds);
        if (parsedCreds.clientId) setClientId(parsedCreds.clientId);
        if (parsedCreds.clientSecret) setClientSecret(parsedCreds.clientSecret);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const fetchOpenFinanceData = useCallback(
    async (itemsToFetch = savedItemIds, customClientId = clientId, customClientSecret = clientSecret) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/pluggy/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemIds: itemsToFetch,
            clientId: customClientId || undefined,
            clientSecret: customClientSecret || undefined,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setStatusBanner({
            type: 'error',
            text: json.error || 'Não foi possível carregar os dados do Open Finance.',
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro de conexão com a API Pluggy';
        setStatusBanner({ type: 'error', text: msg });
      } finally {
        setIsLoading(false);
      }
    },
    [savedItemIds, clientId, clientSecret]
  );

  useEffect(() => {
    fetchOpenFinanceData();
  }, [fetchOpenFinanceData]);

  // Save credentials in localStorage and re-sync
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        STORAGE_CREDS_KEY,
        JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() })
      );
      setStatusBanner({
        type: 'success',
        text: 'Credenciais da Pluggy salvas! Agora você pode abrir o widget oficial Pluggy Connect.',
      });
      setIsConfigOpen(false);
      fetchOpenFinanceData(savedItemIds, clientId.trim(), clientSecret.trim());
    } catch {
      setStatusBanner({ type: 'error', text: 'Falha ao salvar credenciais localmente.' });
    }
  };

  // Launch Pluggy Connect Widget
  const handleOpenPluggyConnect = async () => {
    setIsGeneratingToken(true);
    setStatusBanner(null);

    try {
      const res = await fetch('/api/pluggy/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId.trim() || undefined,
          clientSecret: clientSecret.trim() || undefined,
          clientUserId: 'faturaflow-user',
        }),
      });

      const json = await res.json();

      if (!json.success || !json.accessToken) {
        if (json.code === 'MISSING_CREDENTIALS') {
          setIsConfigOpen(true);
          setStatusBanner({
            type: 'warning',
            text: 'Para abrir o Widget em tempo real da Pluggy, informe seu PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET abaixo (ou configure no .env.local). Enquanto isso, o painel exibe a demonstração Sandbox.',
          });
        } else {
          setStatusBanner({
            type: 'error',
            text: json.error || 'Erro ao gerar Connect Token na API da Pluggy.',
          });
        }
        return;
      }

      setConnectToken(json.accessToken);
      setIsWidgetOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao solicitar token do Pluggy Connect';
      setStatusBanner({ type: 'error', text: msg });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleWidgetSuccess = async (itemData: { item: { id: string; connector?: { name?: string } } }) => {
    const newItemId = itemData?.item?.id;
    const bankName = itemData?.item?.connector?.name || 'Instituição';

    setIsWidgetOpen(false);
    setConnectToken(null);

    if (newItemId) {
      const updated = Array.from(new Set([...savedItemIds, newItemId]));
      setSavedItemIds(updated);
      try {
        localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      setStatusBanner({
        type: 'success',
        text: `Conexão Open Finance com ${bankName} (Item: ${newItemId.slice(0, 8)}...) concluída e sincronizada com sucesso!`,
      });
      await fetchOpenFinanceData(updated, clientId, clientSecret);
    }
  };

  const handleRemoveConnection = (itemId: string) => {
    const updated = savedItemIds.filter((id) => id !== itemId);
    setSavedItemIds(updated);
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setStatusBanner({
      type: 'info',
      text: 'Conexão removida da lista local.',
    });
    fetchOpenFinanceData(updated, clientId, clientSecret);
  };

  const handleAddManualItemId = (manualId: string) => {
    const clean = manualId.trim();
    if (!clean) return;
    const updated = Array.from(new Set([...savedItemIds, clean]));
    setSavedItemIds(updated);
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    fetchOpenFinanceData(updated, clientId, clientSecret);
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-spin">
          <RefreshCw className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
            Sincronizando Open Finance via Pluggy...
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Consultando contas correntes, cartões de crédito, investimentos e transações PIX reguladas pelo Banco Central.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filteredTransactions = data.transactions.filter((tx) => {
    const matchesBank = !selectedInstitution || tx.institutionName === selectedInstitution;
    const matchesSearch =
      !searchQuery ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.institutionName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBank && matchesSearch;
  });

  const filteredAccounts = data.accounts.filter(
    (acc) => !selectedInstitution || acc.institutionName === selectedInstitution
  );

  const filteredInvestments = data.investments.filter(
    (inv) => !selectedInstitution || inv.institutionName === selectedInstitution
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Pluggy Connect Modal Widget (Rendered when user clicks Connect) */}
      {isWidgetOpen && connectToken && (
        <PluggyConnectWidget
          connectToken={connectToken}
          includeSandbox={includeSandbox}
          theme="dark"
          language="pt"
          onSuccess={handleWidgetSuccess}
          onError={(err) => {
            setStatusBanner({
              type: 'error',
              text: err?.message || 'Erro durante a conexão no Pluggy Connect.',
            });
          }}
          onClose={() => {
            setIsWidgetOpen(false);
            setConnectToken(null);
          }}
        />
      )}

      {/* Hero Banner Open Finance */}
      <div className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 light:bg-white light:border-slate-200 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                Pluggy Open Finance Brasil
              </span>
              {data.mode === 'live' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  API Conectada (Produção / Live)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Modo Sandbox / Demonstração Ativo
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white dark:text-white light:text-slate-900">
              Central de Contas, Cartões & Investimentos
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
              Integração direta via SDK oficial da <strong>Pluggy</strong> com o ecossistema do Banco Central.
              Conecte seus bancos (Nubank, Itaú, Bradesco, Santander, BB, XP, BTG) para sincronizar saldos em conta corrente,
              faturas de cartões, transações PIX e carteira de investimentos automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 light:bg-slate-100 light:text-slate-800 light:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Configurar API Keys</span>
            </button>

            <button
              onClick={() => fetchOpenFinanceData()}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition-all cursor-pointer disabled:opacity-50"
              title="Sincronizar dados agora"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={handleOpenPluggyConnect}
              disabled={isGeneratingToken}
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isGeneratingToken ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Iniciando Pluggy...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Conectar Instituição (Pluggy Connect)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status / Feedback Alert */}
        {statusBanner && (
          <div
            className={`mt-5 p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
              statusBanner.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : statusBanner.type === 'warning'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                : statusBanner.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Drawer de Configuração de Credenciais da Pluggy */}
        {isConfigOpen && (
          <form
            onSubmit={handleSaveCredentials}
            className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in duration-200"
          >
            <div className="md:col-span-12 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Credenciais da API Pluggy (Client ID & Client Secret)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Obtenha gratuitamente no painel{' '}
                  <a
                    href="https://dashboard.pluggy.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline inline-flex items-center gap-1"
                  >
                    dashboard.pluggy.ai <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  ou defina <code className="text-emerald-300">PLUGGY_CLIENT_ID</code> e{' '}
                  <code className="text-emerald-300">PLUGGY_CLIENT_SECRET</code> no arquivo <code className="text-emerald-300">.env.local</code>.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSandbox}
                  onChange={(e) => setIncludeSandbox(e.target.checked)}
                  className="rounded border-white/20 bg-slate-900 text-emerald-500"
                />
                <span>Incluir conectores Sandbox (Pluggy Bank)</span>
              </label>
            </div>

            <div className="md:col-span-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                PLUGGY_CLIENT_ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ex: 5a8f9b2c-1234-4567-89ab-cdef01234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                PLUGGY_CLIENT_SECRET
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer"
              >
                Salvar Chaves
              </button>
            </div>

            {/* Opção para testar um Item ID já existente na conta Pluggy */}
            <div className="md:col-span-12 pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <span>Já possui um <strong>Item ID</strong> conectado na Pluggy? Adicione manualmente para sincronizar:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="manual-pluggy-item-input"
                  placeholder="UUID do Item (ex: 7f89c1a2-...)"
                  className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/10 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('manual-pluggy-item-input') as HTMLInputElement | null;
                    if (input && input.value) {
                      handleAddManualItemId(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold cursor-pointer"
                >
                  Vincular Item
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* KPIs Consolidados do Open Finance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo em Conta Corrente */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-white/10 bg-slate-900/60 light:bg-white light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saldo em Contas Correntes
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
              {formatBRL(data.summary.totalCheckingBalance)}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              Disponível imediatamente em {data.accounts.filter((a) => a.type === 'BANK').length} contas
            </p>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Entradas PIX no mês:</span>
            <span className="text-emerald-300 font-semibold">{formatBRL(data.summary.monthlyPixInflow)}</span>
          </div>
        </div>

        {/* Total Investido */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-white/10 bg-slate-900/60 light:bg-white light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Carteira de Investimentos
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
              {formatBRL(data.summary.totalInvestmentsBalance)}
            </div>
            <p className="text-[11px] text-indigo-400 font-medium mt-1">
              {data.investments.length} ativos sincronizados (CDB, LCI, Tesouro)
            </p>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rentabilidade média:</span>
            <span className="text-indigo-300 font-semibold">~100% do CDI (+0,94% a.m.)</span>
          </div>
        </div>

        {/* Faturas Cartões via Open Finance */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-white/10 bg-slate-900/60 light:bg-white light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Faturas Abertas (Open Finance)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900">
              {formatBRL(data.summary.totalCreditCardInvoice)}
            </div>
            <p className="text-[11px] text-rose-400 font-medium mt-1">
              Limite livre: {formatBRL(data.summary.totalCreditAvailable)}
            </p>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Limite Total Combinado:</span>
            <span className="text-slate-200 font-semibold">{formatBRL(data.summary.totalCreditLimit)}</span>
          </div>
        </div>

        {/* Patrimônio Líquido */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/70 light:bg-white light:border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Patrimônio Líquido Atual
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {formatBRL(data.summary.netWorth)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Saldos + Investimentos − Faturas Abertas
            </p>
          </div>
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Saídas PIX/Boletos (mês):</span>
            <span className="text-amber-300 font-semibold">{formatBRL(data.summary.monthlyPixOutflow)}</span>
          </div>
        </div>
      </div>

      {/* Instituições Conectadas (Consentimentos Open Finance) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Instituições Conectadas via Consentimento Open Finance ({data.connections.length})
            </h2>
            <span className="text-xs text-slate-400">(Clique para filtrar por banco)</span>
          </div>
          {selectedInstitution && (
            <button
              onClick={() => setSelectedInstitution(null)}
              className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Mostrar todas ({selectedInstitution})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.connections.map((conn) => {
            const isSelected = selectedInstitution === conn.institutionName;
            const bankAccounts = data.accounts.filter((a) => a.itemId === conn.id);
            const checking = bankAccounts.find((a) => a.type === 'BANK');
            const credit = bankAccounts.find((a) => a.type === 'CREDIT');

            return (
              <div
                key={conn.id}
                onClick={() => setSelectedInstitution(isSelected ? null : conn.institutionName)}
                className={`rounded-2xl border p-5 backdrop-blur-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-slate-900/90'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/25'
                } light:bg-white light:border-slate-200`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                      style={{ backgroundColor: conn.primaryColor }}
                    >
                      {conn.institutionLogoText}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                          {conn.institutionName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {conn.status === 'UPDATED' ? 'Sincronizado' : conn.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Item ID: <code className="text-slate-300">{conn.id.slice(0, 18)}...</code>
                      </p>
                    </div>
                  </div>

                  {savedItemIds.includes(conn.id) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveConnection(conn.id);
                      }}
                      title="Desconectar instituição"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Saldos Rápidos do Banco */}
                <div className="grid grid-cols-2 gap-3 my-4 py-3 border-y border-white/5">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Conta Corrente
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      {checking ? formatBRL(checking.balance) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Fatura Cartão
                    </span>
                    <span className="text-base font-bold text-rose-400">
                      {credit ? formatBRL(credit.balance) : '—'}
                    </span>
                  </div>
                </div>

                {/* Permissões de Produtos Open Finance */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex flex-wrap gap-1">
                    {conn.products.map((prod) => (
                      <span
                        key={prod}
                        className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[10px] font-medium"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-abas da Página Open Finance */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Visão Consolidada (360º)
          </button>
          <button
            onClick={() => setActiveSubTab('accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'accounts'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Contas & Cartões ({filteredAccounts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'transactions'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Extrato Unificado PIX & Cartão ({filteredTransactions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('investments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'investments'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Investimentos ({filteredInvestments.length})
          </button>
        </div>
      </div>

      {/* CONTEÚDO DAS SUB-ABAS */}
      {(activeSubTab === 'overview' || activeSubTab === 'accounts') && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Contas Bancárias e Cartões de Crédito Sincronizados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 light:bg-white light:border-slate-200 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        acc.type === 'BANK'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {acc.type === 'BANK' ? 'Conta Corrente' : `Cartão ${acc.creditData?.brand || ''}`}
                    </span>
                    <h4 className="text-sm font-bold text-white dark:text-white light:text-slate-900 mt-2">
                      {acc.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {acc.institutionName} • {acc.number}
                    </p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: acc.institutionColor }}
                  />
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    {acc.type === 'BANK' ? 'Saldo Disponível' : 'Fatura Atual em Aberto'}
                  </span>
                  <span
                    className={`text-xl font-black ${
                      acc.type === 'BANK' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBRL(acc.balance)}
                  </span>
                </div>

                {acc.creditData && (
                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Limite Total:</span>
                      <span className="text-slate-200 font-semibold">
                        {formatBRL(acc.creditData.creditLimit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limite Disponível:</span>
                      <span className="text-emerald-400 font-semibold">
                        {formatBRL(acc.creditData.availableCreditLimit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fechamento / Vencimento:</span>
                      <span className="text-slate-300">
                        {acc.creditData.balanceCloseDate} / {acc.creditData.balanceDueDate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeSubTab === 'overview' || activeSubTab === 'investments') && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Posição Consolidada de Investimentos via Pluggy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInvestments.map((inv) => {
              const profitValue = inv.balance - inv.amountOriginal;
              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 light:bg-white light:border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {inv.subtype}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400">{inv.rateLabel}</span>
                      </div>
                      <h4 className="text-base font-bold text-white dark:text-white light:text-slate-900 mt-1.5">
                        {inv.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Custódia: <strong className="text-slate-200">{inv.institutionName}</strong> • Código: {inv.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block">Saldo Bruto Atual</span>
                      <span className="text-lg font-black text-white dark:text-white light:text-slate-900">
                        {formatBRL(inv.balance)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>Valor Aplicado: {formatBRL(inv.amountOriginal)}</span>
                    <span className="text-emerald-400 font-semibold">
                      Rendimento: +{formatBRL(profitValue)} (+{inv.profitabilityYear}% a.a.)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(activeSubTab === 'overview' || activeSubTab === 'transactions') && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 light:bg-white light:border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Movimentações Recentes Open Finance (PIX, Débito Automático & Cartões)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Importe despesas de conta corrente (PIX / Boletos) diretamente para a aba &ldquo;Gastos Fora do Cartão&rdquo; com 1 clique.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar PIX, estabelecimento, banco..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Instituição</th>
                  <th className="py-3 px-3">Descrição</th>
                  <th className="py-3 px-3">Método</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3 text-right">Valor</th>
                  {onImportTransactionAsExternal && (
                    <th className="py-3 px-3 text-right">Ação no App</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'CREDIT';
                  const isAlreadyImported = Boolean(importedIds[tx.id]);
                  const canImportAsExternal =
                    tx.type === 'DEBIT' &&
                    tx.paymentMethod !== 'CREDIT_CARD' &&
                    tx.category !== 'Pagamentos & Créditos';

                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {tx.institutionName}
                      </td>
                      <td className="py-3 px-3 text-white font-medium">
                        <div className="flex items-center gap-2">
                          {isCredit ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{tx.description}</span>
                          {tx.installment && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                              {tx.installment.number}/{tx.installment.total}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[10px] font-bold">
                          {tx.paymentMethod || 'CONTA'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{tx.category}</td>
                      <td
                        className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                          isCredit ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {isCredit ? '+' : '-'} {formatBRL(tx.amount)}
                      </td>
                      {onImportTransactionAsExternal && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {canImportAsExternal ? (
                            <button
                              disabled={isAlreadyImported}
                              onClick={() => {
                                onImportTransactionAsExternal(tx);
                                setImportedIds((prev) => ({ ...prev, [tx.id]: true }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer ${
                                isAlreadyImported
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isAlreadyImported ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Sincronizado</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Enviar p/ Fora do Cartão</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

