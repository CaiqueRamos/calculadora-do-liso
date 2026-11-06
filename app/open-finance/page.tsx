'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PluggyOpenFinanceHub from '@/components/PluggyOpenFinanceHub';
import { OpenFinanceTransaction } from '@/lib/pluggyClient';
import { ExternalExpense, DEFAULT_EXPENSES } from '@/components/ExternalExpenses';

export default function OpenFinancePage() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const handleImportTransactionAsExternal = (tx: OpenFinanceTransaction) => {
    try {
      const saved = localStorage.getItem('faturaflow_external_expenses_v1');
      const currentList: ExternalExpense[] = saved ? JSON.parse(saved) : DEFAULT_EXPENSES;

      const newExpense: ExternalExpense = {
        id: `pluggy-${tx.id}-${Date.now()}`,
        name: `${tx.description} (${tx.institutionName})`,
        amount: tx.amount,
        category: tx.category || 'Outros Gastos',
        dueDateDay: parseInt(tx.date.slice(8, 10), 10) || 10,
        status: tx.status === 'POSTED' ? 'paid' : 'pending',
        isRecurring: false,
      };

      const updated = [newExpense, ...currentList];
      localStorage.setItem('faturaflow_external_expenses_v1', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Background radial gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>
      </div>

      {/* Header com Menu de Navegação */}
      <Header isDark={isDark} setIsDark={setIsDark} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7 z-10">
        <PluggyOpenFinanceHub onImportTransactionAsExternal={handleImportTransactionAsExternal} />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 light:border-slate-200 py-6 text-center text-xs text-slate-500 z-10">
        <p>FaturaFlow • Integração Oficial Open Finance Brasil via Pluggy SDK</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Consentimento criptografado ponta-a-ponta seguindo os padrões do Banco Central do Brasil.
        </p>
      </footer>
    </div>
  );
}

