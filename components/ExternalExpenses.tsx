'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Wallet,
  Receipt,
  PieChart,
  Droplet,
  Zap,
  Wifi,
  GraduationCap,
  Building,
  RotateCcw
} from 'lucide-react';
import { formatBRL } from '@/lib/invoiceParser';

export interface ExternalExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDateDay?: number;
  status: 'pending' | 'paid';
  isRecurring: boolean;
}

export const DEFAULT_EXPENSES: ExternalExpense[] = [
  { id: 'ext-1', name: 'Água', amount: 177.00, category: 'Contas de Consumo', dueDateDay: 10, status: 'pending', isRecurring: true },
  { id: 'ext-2', name: 'Luz (Energia)', amount: 730.00, category: 'Contas de Consumo', dueDateDay: 15, status: 'pending', isRecurring: true },
  { id: 'ext-3', name: 'Internet', amount: 149.90, category: 'Serviços & Telecom', dueDateDay: 20, status: 'pending', isRecurring: true },
  { id: 'ext-4', name: 'Condomínio', amount: 287.22, category: 'Moradia', dueDateDay: 10, status: 'pending', isRecurring: true },
  { id: 'ext-5', name: 'Financiamento', amount: 535.00, category: 'Moradia', dueDateDay: 12, status: 'pending', isRecurring: true },
  { id: 'ext-6', name: 'IPTU', amount: 82.00, category: 'Impostos & Taxas', dueDateDay: 10, status: 'pending', isRecurring: true },
  { id: 'ext-7', name: 'Inglês (Curso)', amount: 450.00, category: 'Educação', dueDateDay: 5, status: 'pending', isRecurring: true },
];

export const CATEGORY_OPTIONS = [
  'Contas de Consumo',
  'Moradia',
  'Serviços & Telecom',
  'Educação',
  'Impostos & Taxas',
  'Saúde & Bem-estar',
  'Outros Gastos',
];

interface ExternalExpensesProps {
  creditCardTotal: number;
  expenses?: ExternalExpense[];
  onExpensesChange?: (expenses: ExternalExpense[]) => void;
  onTotalChange?: (total: number) => void;
}

export default function ExternalExpenses({
  creditCardTotal,
  expenses: controlledExpenses,
  onExpensesChange,
  onTotalChange,
}: ExternalExpensesProps) {
  const [internalExpenses, setInternalExpenses] = useState<ExternalExpense[]>(DEFAULT_EXPENSES);
  const expenses = controlledExpenses ?? internalExpenses;
  const updateExpenses = (newExpensesOrFn: ExternalExpense[] | ((prev: ExternalExpense[]) => ExternalExpense[])) => {
    const updated = typeof newExpensesOrFn === 'function' ? newExpensesOrFn(expenses) : newExpensesOrFn;
    if (onExpensesChange) {
      onExpensesChange(updated);
    } else {
      setInternalExpenses(updated);
    }
    try {
      localStorage.setItem('faturaflow_external_expenses_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    const sum = updated.reduce((acc, e) => acc + e.amount, 0);
    onTotalChange?.(sum);
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; amount: string; category: string; dueDateDay: string }>({
    name: '',
    amount: '',
    category: '',
    dueDateDay: '',
  });

  // New expense form
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORY_OPTIONS[0]);
  const [newDay, setNewDay] = useState('');

  // Load from localStorage if not controlled
  useEffect(() => {
    if (controlledExpenses) return;
    try {
      const saved = localStorage.getItem('faturaflow_external_expenses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInternalExpenses(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [controlledExpenses]);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPaid = expenses.filter((e) => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const totalPending = expenses.filter((e) => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const grandTotalMonth = creditCardTotal + totalExpenses;

  // Start inline editing
  const handleStartEdit = (exp: ExternalExpense) => {
    setEditingId(exp.id);
    setEditForm({
      name: exp.name,
      amount: exp.amount.toString(),
      category: exp.category,
      dueDateDay: exp.dueDateDay ? exp.dueDateDay.toString() : '',
    });
  };

  // Save inline edit
  const handleSaveEdit = (id: string) => {
    const parsedAmount = parseFloat(editForm.amount.replace(',', '.'));
    if (!editForm.name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    updateExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              name: editForm.name.trim(),
              amount: parsedAmount,
              category: editForm.category,
              dueDateDay: editForm.dueDateDay ? parseInt(editForm.dueDateDay, 10) : undefined,
            }
          : e
      )
    );
    setEditingId(null);
  };

  // Delete expense
  const handleDelete = (id: string) => {
    updateExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Toggle paid / pending status
  const handleToggleStatus = (id: string) => {
    updateExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === 'paid' ? 'pending' : 'paid' } : e
      )
    );
  };

  // Add new expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount.replace(',', '.'));
    if (!newName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExp: ExternalExpense = {
      id: `ext-${Date.now()}`,
      name: newName.trim(),
      amount: parsedAmount,
      category: newCategory,
      dueDateDay: newDay ? parseInt(newDay, 10) : undefined,
      status: 'pending',
      isRecurring: true,
    };

    updateExpenses((prev) => [newExp, ...prev]);
    setNewName('');
    setNewAmount('');
    setNewDay('');
  };

  // Restore defaults
  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar a lista inicial com Água, Luz, Internet, Condomínio, Financiamento, IPTU e Inglês?')) {
      updateExpenses(DEFAULT_EXPENSES);
      localStorage.removeItem('faturaflow_external_expenses_v1');
    }
  };

  const getIconForExpense = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('água') || n.includes('agua')) return <Droplet className="w-4 h-4 text-cyan-400" />;
    if (n.includes('luz') || n.includes('energia')) return <Zap className="w-4 h-4 text-amber-400" />;
    if (n.includes('internet') || n.includes('wifi')) return <Wifi className="w-4 h-4 text-blue-400" />;
    if (n.includes('condom') || n.includes('financiamento')) return <Building className="w-4 h-4 text-indigo-400" />;
    if (n.includes('inglês') || n.includes('ingles') || n.includes('curso') || n.includes('faculdade')) return <GraduationCap className="w-4 h-4 text-emerald-400" />;
    return <Receipt className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards: Overview of Outside-Card vs Card Spend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gastos Fixos/Avulsos */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-950/80 light:bg-white light:border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-amber-400" />
              Gastos Fora do Cartão
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {expenses.length} contas
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white dark:text-white light:text-slate-900">
            {formatBRL(totalExpenses)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contas fixas, boletos e despesas situacionais
          </p>
        </div>

        {/* Total Pendente */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-900/60 to-slate-950/80 light:bg-white light:border-rose-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-400" />
              A Pagar (Pendente)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {expenses.filter((e) => e.status === 'pending').length} itens
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-400">
            {formatBRL(totalPending)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contas ainda não liquidadas este mês
          </p>
        </div>

        {/* Total Já Pago */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-950/80 light:bg-white light:border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Já Quitado (Pago)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {expenses.filter((e) => e.status === 'paid').length} itens
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400">
            {formatBRL(totalPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pagamentos já realizados no mês
          </p>
        </div>

        {/* Total Geral Consolidado (Cartão + Fixos) */}
        <div className="rounded-2xl border p-5 backdrop-blur-xl border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-950/80 light:bg-white light:border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-indigo-400" />
              Total Geral do Mês
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              Cartões + Fixos
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white dark:text-white light:text-slate-900">
            {formatBRL(grandTotalMonth)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Faturas ({formatBRL(creditCardTotal)}) + Fixos ({formatBRL(totalExpenses)})
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm space-y-6">
        {/* Header and Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5 light:border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                Gastos Situacionais & Despesas Fora do Cartão
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Totalmente Editável
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique nos valores ou nomes para editar, alterar status ou adicionar novas despesas
            </p>
          </div>

          <button
            onClick={handleResetDefaults}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaurar valores de exemplo iniciais"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar padrão inicial</span>
          </button>
        </div>

        {/* Quick Add New Expense Form */}
        <form
          onSubmit={handleAddExpense}
          className="p-4 rounded-xl border border-white/10 bg-slate-950/60 light:bg-slate-50 light:border-slate-200 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-800">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Adicionar Novo Gasto / Despesa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Nome da despesa (ex: Academia, Escola...)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 dark:bg-slate-900 light:bg-white text-white dark:text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                <input
                  type="text"
                  placeholder="Valor (ex: 250,00)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 dark:bg-slate-900 light:bg-white text-white dark:text-white light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 dark:bg-slate-900 light:bg-white text-white dark:text-white light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </form>

        {/* Editable Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 light:border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 light:border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Despesa / Conta</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Dia Vencimento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 light:divide-slate-200">
              {expenses.map((exp) => {
                const isEditing = editingId === exp.id;
                const isPaid = exp.status === 'paid';

                if (isEditing) {
                  return (
                    <tr key={exp.id} className="bg-indigo-950/30">
                      <td className="py-3 px-4">
                        <span className="text-[10px] text-slate-400">Editando</span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-slate-900 text-white w-full"
                          autoFocus
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-slate-900 text-white"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          placeholder="Dia"
                          min="1"
                          max="31"
                          value={editForm.dueDateDay}
                          onChange={(e) => setEditForm({ ...editForm, dueDateDay: e.target.value })}
                          className="px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-slate-900 text-white w-16"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="text"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          className="px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-slate-900 text-white text-right w-24 font-bold"
                        />
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(exp.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            title="Salvar alterações"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="Cancelar edição"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Status Badge Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(exp.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                        title="Clique para alternar entre Pago e Pendente"
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Pago
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendente
                          </>
                        )}
                      </button>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                          {getIconForExpense(exp.name)}
                        </div>
                        <div>
                          <div 
                            onClick={() => handleStartEdit(exp)}
                            className={`font-semibold text-slate-200 dark:text-slate-200 light:text-slate-900 group-hover:text-amber-400 cursor-pointer ${
                              isPaid ? 'line-through opacity-70' : ''
                            }`}
                            title="Clique para editar nome"
                          >
                            {exp.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">
                        {exp.category}
                      </span>
                    </td>

                    {/* Due Day */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {exp.dueDateDay ? `Dia ${exp.dueDateDay}` : 'Situacional'}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-white dark:text-white light:text-slate-900 whitespace-nowrap">
                      <span
                        onClick={() => handleStartEdit(exp)}
                        className="cursor-pointer hover:underline hover:text-amber-400"
                        title="Clique para editar valor"
                      >
                        {formatBRL(exp.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(exp)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                          title="Editar despesa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir despesa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {expenses.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhuma despesa cadastrada. Use o formulário acima para adicionar contas!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
