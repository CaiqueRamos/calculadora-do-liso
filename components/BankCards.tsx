'use client';

import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  Layers, 
  Gift, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { ParsedInvoice, formatBRL } from '@/lib/invoiceParser';

interface BankCardsProps {
  invoices: ParsedInvoice[];
  selectedBank: string | null;
  onSelectBank: (bankName: string | null) => void;
}

export default function BankCards({
  invoices,
  selectedBank,
  onSelectBank,
}: BankCardsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Faturas por Cartão & Instituição
          </h2>
          <span className="text-xs text-slate-400">
            (Clique para filtrar dados)
          </span>
        </div>
        {selectedBank && (
          <button
            onClick={() => onSelectBank(null)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
          >
            Limpar filtro ({selectedBank})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {invoices.map((inv) => {
          const isSelected = selectedBank === inv.bank;
          const isBradesco = inv.bank === 'Bradesco';
          const isItau = inv.bank === 'Itaú';
          const isNubank = inv.bank === 'Nubank';
          const isCaixa = inv.bank === 'Caixa';

          // Bank specific gradients and accents
          let cardGradient = 'from-slate-900 to-slate-950';
          let borderAccent = 'border-white/10';
          let badgeBg = 'bg-slate-800 text-slate-200';
          let bankLogoColor = 'text-white';
          let glowClass = '';

          if (isBradesco) {
            cardGradient = 'from-rose-950/40 via-slate-900 to-slate-950';
            borderAccent = isSelected ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-rose-500/25 hover:border-rose-500/50';
            badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            bankLogoColor = 'text-rose-400';
            glowClass = 'hover:shadow-rose-950/50';
          } else if (isItau) {
            cardGradient = 'from-amber-950/40 via-slate-900 to-slate-950';
            borderAccent = isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-amber-500/25 hover:border-amber-500/50';
            badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            bankLogoColor = 'text-amber-400';
            glowClass = 'hover:shadow-amber-950/50';
          } else if (isNubank) {
            cardGradient = 'from-purple-950/40 via-slate-900 to-slate-950';
            borderAccent = isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-purple-500/25 hover:border-purple-500/50';
            badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            bankLogoColor = 'text-purple-400';
            glowClass = 'hover:shadow-purple-950/50';
          } else if (isCaixa) {
            cardGradient = 'from-blue-950/40 via-slate-900 to-slate-950';
            borderAccent = isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-blue-500/25 hover:border-blue-500/50';
            badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            bankLogoColor = 'text-blue-400';
            glowClass = 'hover:shadow-blue-950/50';
          }

          const limitPct = inv.limitTotal && inv.limitTotal > 0
            ? Math.round(((inv.limitUsed || (inv.limitTotal - (inv.limitAvailable || 0))) / inv.limitTotal) * 100)
            : 0;

          return (
            <div
              key={inv.id}
              onClick={() => onSelectBank(isSelected ? null : inv.bank)}
              className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1 ${cardGradient} ${borderAccent} ${glowClass} light:bg-white light:shadow-sm`}
            >
              {/* Header inside Card */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-white/10 border border-white/10 ${bankLogoColor}`}>
                    {inv.bank[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                      {inv.bank}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500">
                      {inv.cardNumber || 'Cartão Principal'}
                    </p>
                  </div>
                </div>

                <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeBg} flex items-center gap-1`}>
                  <Calendar className="w-3 h-3" />
                  Vence {inv.dueDate}
                </div>
              </div>

              {/* Titular */}
              <div className="text-[11px] text-slate-400 mb-4 truncate">
                Titular: <span className="text-slate-200 dark:text-slate-200 light:text-slate-700 font-medium">{inv.cardHolder}</span>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 light:border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Valor Desta Fatura
                  </span>
                  <div className="text-xl font-bold text-white dark:text-white light:text-slate-900 mt-0.5">
                    {formatBRL(inv.totalCurrent)}
                  </div>
                  {inv.minimumPayment && (
                    <span className="text-[10px] text-slate-500">
                      Mínimo: {formatBRL(inv.minimumPayment)}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-amber-400/90 tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Valores Futuros
                  </span>
                  <div className="text-xl font-bold text-amber-400 dark:text-amber-400 light:text-amber-600 mt-0.5">
                    {formatBRL(inv.totalFuture)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {inv.futureProjections.length} parcelas restantes
                  </span>
                </div>
              </div>

              {/* Limite & Barra */}
              {inv.limitTotal && (
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Limite Total</span>
                    <span className="text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                      {formatBRL(inv.limitTotal)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isBradesco ? 'bg-rose-500' : isItau ? 'bg-amber-500' : isNubank ? 'bg-purple-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, limitPct))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Utilizado: {limitPct}%</span>
                    <span>Disponível: {formatBRL(inv.limitAvailable || 0)}</span>
                  </div>
                </div>
              )}

              {/* Footer info: Livelo or Status */}
              <div className="mt-4 pt-2.5 flex items-center justify-between text-xs text-slate-400">
                {inv.points ? (
                  <span className="text-[11px] text-amber-300 flex items-center gap-1 font-medium">
                    <Gift className="w-3.5 h-3.5" />
                    {inv.points.toLocaleString('pt-BR')} pts Livelo
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {inv.transactions.length} lançamentos
                  </span>
                )}
                <span className="text-[11px] text-indigo-400 flex items-center gap-0.5 font-medium group-hover:translate-x-1 transition-transform">
                  {isSelected ? 'Filtrado' : 'Ver detalhes'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
