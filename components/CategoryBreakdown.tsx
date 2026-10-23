'use client';

import React from 'react';
import { 
  PieChart, 
  ShoppingBag, 
  Car, 
  Utensils, 
  Tv, 
  Gamepad2, 
  HeartPulse, 
  GraduationCap, 
  Tag, 
  Layers
} from 'lucide-react';
import { formatBRL } from '@/lib/invoiceParser';

interface CategoryBreakdownProps {
  categories: {
    category: string;
    total: number;
    percentage: number;
    color: string;
  }[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Transporte': <Car className="w-4 h-4" />,
  'Restaurante & Delivery': <Utensils className="w-4 h-4" />,
  'Supermercado': <ShoppingBag className="w-4 h-4" />,
  'Assinaturas & Streaming': <Tv className="w-4 h-4" />,
  'Jogos & Lazer': <Gamepad2 className="w-4 h-4" />,
  'Saúde & Farmácia': <HeartPulse className="w-4 h-4" />,
  'Educação': <GraduationCap className="w-4 h-4" />,
  'Compras & Lojas': <Tag className="w-4 h-4" />,
};

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const topCategories = categories.filter((c) => c.category !== 'Pagamentos & Créditos').slice(0, 8);

  return (
    <div className="rounded-2xl border p-6 backdrop-blur-xl border-white/10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:border-slate-200 light:shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Distribuição por Categoria de Gasto
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Classificação automática dos lançamentos das faturas
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
          {categories.length} categorias
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3.5">
        {topCategories.map((cat) => {
          const icon = CATEGORY_ICONS[cat.category] || <Layers className="w-4 h-4" />;

          return (
            <div key={cat.category} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    {icon}
                  </div>
                  <span className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-800">
                    {cat.category}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 font-medium">
                  <span className="text-slate-400 text-[11px]">
                    {cat.percentage.toFixed(1)}%
                  </span>
                  <span className="font-bold text-white dark:text-white light:text-slate-900">
                    {formatBRL(cat.total)}
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-1.5 rounded-full bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 group-hover:brightness-125"
                  style={{
                    width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                    backgroundColor: cat.color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
