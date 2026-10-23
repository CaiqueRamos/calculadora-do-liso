import { Transaction, ParsedInvoice, formatBRL } from '@/lib/invoiceParser';
import { ExternalExpense } from '@/components/ExternalExpenses';

export type ExpenseNature = 'essential' | 'variable';

export interface AIClassifiedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  bank: string;
  category: string;
  classification: ExpenseNature;
  confidence: number; // 0 to 1
  reason: string;
  isUserOverridden: boolean;
}

export interface BankClassificationStats {
  bank: string;
  total: number;
  essentialTotal: number;
  variableTotal: number;
  essentialPct: number;
  variablePct: number;
  transactionsCount: number;
}

export interface CategoryClassificationGroup {
  category: string;
  total: number;
  percentage: number;
  count: number;
  nature: ExpenseNature;
}

export interface AIAnalysisResult {
  scope: 'cards_only' | 'cards_plus_external';
  totalAnalyzed: number;
  essentialTotal: number;
  essentialPct: number;
  essentialCount: number;
  variableTotal: number;
  variablePct: number;
  variableCount: number;
  
  // Benchmark with 50/30/20 rule
  benchmark503020: {
    recommendedEssentialMaxPct: number;
    recommendedVariableMaxPct: number;
    recommendedInvestPct: number;
    essentialDifference: number; // essentialPct - 50
    variableDifference: number;  // variablePct - 30
    statusLabel: string;
    statusTone: 'good' | 'warning' | 'alert';
  };

  byBank: BankClassificationStats[];
  topEssentialCategories: CategoryClassificationGroup[];
  topVariableCategories: CategoryClassificationGroup[];
  classifiedTransactions: AIClassifiedTransaction[];

  aiDiagnosis: {
    badge: string;
    title: string;
    summary: string;
    verdict: string;
    highlights: string[];
    actionTips: string[];
  };

  potentialSavings: {
    pct15: number;
    pct25: number;
    pct35: number;
    pct50: number;
    annualAt25Pct: number;
  };
}

/**
 * Intelligent categorization logic determining Essential vs Variable nature
 */
export function determineTransactionNature(
  tx: Transaction,
  options: {
    transportAsEssential?: boolean;
    overrides?: Record<string, ExpenseNature>;
  } = {}
): { classification: ExpenseNature; confidence: number; reason: string; isUserOverridden: boolean } {
  const { transportAsEssential = true, overrides = {} } = options;

  // Check user manual override first
  if (overrides[tx.id]) {
    return {
      classification: overrides[tx.id],
      confidence: 1.0,
      reason: 'Ajustado manualmente por você',
      isUserOverridden: true,
    };
  }

  const d = tx.description.toLowerCase();
  const cat = tx.category;

  // 1. Explicit variable / discretionary merchants & categories
  if (
    cat === 'Restaurante & Delivery' ||
    /ifood|pizzaria|burger|burguer|lanchonete|refeic|bifao|sorvete|cafe|doces|chocolat|chopp|torquatu|full foods|michellis|cacau show|chiquinho|sobremesas/i.test(d)
  ) {
    return {
      classification: 'variable',
      confidence: 0.98,
      reason: 'Alimentação fora de casa / delivery gastronômico (dispensável ou flexível)',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Jogos & Lazer' ||
    /steam|playstation|playstati|xbox|nintendo|epic|games|iof.*steam/i.test(d)
  ) {
    return {
      classification: 'variable',
      confidence: 0.99,
      reason: 'Lazer digital, jogos e entretenimento eletrônico',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Assinaturas & Streaming' ||
    /netflix|spotify|hbo|disney|globoplay|amazon\s*prime\s*canais|youtube|prime\s*video|smiles\s*club/i.test(d)
  ) {
    return {
      classification: 'variable',
      confidence: 0.95,
      reason: 'Serviços de streaming e clubes de milhas (estilo de vida e entretenimento)',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Compras & Lojas' ||
    /vivara|havan|casas\s*bahia|gazin|americanas|shopee|mercadolivre|roupa|vestuario|cosmetico|inovar|mix cosmeticos|bigcolchoes|guimatex/i.test(d)
  ) {
    return {
      classification: 'variable',
      confidence: 0.92,
      reason: 'Varejo, moda, joias ou aquisições de consumo não essenciais',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Beleza & Cuidados' ||
    /barbearia|salao|cabelo|estetica|perfumaria/i.test(d)
  ) {
    return {
      classification: 'variable',
      confidence: 0.90,
      reason: 'Cuidados estéticos e serviços de estilo pessoal',
      isUserOverridden: false,
    };
  }

  // 2. Explicit essential categories
  if (
    cat === 'Supermercado' ||
    /supermercado|mercado|hort\s*frut|esquinaverde|super\s*pires|comper|fort\s*atacadista|alimentos|armazem/i.test(d)
  ) {
    return {
      classification: 'essential',
      confidence: 0.98,
      reason: 'Alimentação básica doméstica, feira e itens de higiene e limpeza do lar',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Saúde & Farmácia' ||
    /farmacia|drogasil|raia|medic|saude|droga|clinica|cropp|suplement|hospital|consulta/i.test(d)
  ) {
    return {
      classification: 'essential',
      confidence: 0.99,
      reason: 'Medicamentos, cuidados médicos e saúde indispensável',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Telecom & Internet' ||
    /claro|vivo|tim|oi|internet|telefonia/i.test(d)
  ) {
    return {
      classification: 'essential',
      confidence: 0.95,
      reason: 'Conectividade e comunicação essencial para o dia a dia e trabalho',
      isUserOverridden: false,
    };
  }

  if (
    cat === 'Pets' ||
    /petz|veterin|pet\s*shop/i.test(d)
  ) {
    return {
      classification: 'essential',
      confidence: 0.94,
      reason: 'Alimentação e saúde de animais de estimação sob seus cuidados',
      isUserOverridden: false,
    };
  }

  if (cat === 'Educação' || /livros|editora|educa|curso|faculdade|udemy|alura/i.test(d)) {
    return {
      classification: 'essential',
      confidence: 0.90,
      reason: 'Educação, livros e qualificação profissional',
      isUserOverridden: false,
    };
  }

  // 3. Transport category
  if (
    cat === 'Transporte' ||
    /uber|99\s*ride|99\*|t[aá]xi|estacioname|mobilidade|transporte|gasolina|combustivel/i.test(d)
  ) {
    if (transportAsEssential) {
      return {
        classification: 'essential',
        confidence: 0.90,
        reason: 'Mobilidade urbana e deslocamentos diários necessários para compromissos',
        isUserOverridden: false,
      };
    } else {
      return {
        classification: 'variable',
        confidence: 0.85,
        reason: 'Mobilidade por conveniência (transporte por aplicativo discricionário)',
        isUserOverridden: false,
      };
    }
  }

  // 4. Detailed evaluation for "Outros Gastos" and edge cases
  if (/edztreinador/i.test(d)) {
    return {
      classification: 'variable',
      confidence: 0.88,
      reason: 'Treinamento / mentoria esportiva / coaching opcional',
      isUserOverridden: false,
    };
  }

  if (/microsoft.*pc\s*g|ppro.*microsoft/i.test(d)) {
    return {
      classification: 'variable',
      confidence: 0.95,
      reason: 'Assinatura Xbox Game Pass (jogos/lazer)',
      isUserOverridden: false,
    };
  }

  if (/google\s*g1ai|google/i.test(d)) {
    return {
      classification: 'variable',
      confidence: 0.80,
      reason: 'Serviço de inteligência artificial / armazenamento digital',
      isUserOverridden: false,
    };
  }

  if (/amazonmktplc|amazon/i.test(d)) {
    return {
      classification: 'variable',
      confidence: 0.85,
      reason: 'Compras de marketplace e produtos no comércio eletrônico',
      isUserOverridden: false,
    };
  }

  if (/arquitecnica/i.test(d)) {
    return {
      classification: 'essential',
      confidence: 0.82,
      reason: 'Materiais técnicos de desenho/arquitetura/trabalho',
      isUserOverridden: false,
    };
  }

  if (/eliton\s*nunes/i.test(d)) {
    return {
      classification: 'variable',
      confidence: 0.75,
      reason: 'Prestador de serviço pessoal (classificação flexível)',
      isUserOverridden: false,
    };
  }

  // Default fallback based on conservative financial hygiene
  return {
    classification: 'variable',
    confidence: 0.70,
    reason: 'Gasto genérico não classificado como sobrevivência ou saúde básica',
    isUserOverridden: false,
  };
}

/**
 * Runs the complete AI analysis across all card transactions
 */
export function runAICardExpenseAnalysis(params: {
  transactions: Transaction[];
  invoices?: ParsedInvoice[];
  includeExternal?: boolean;
  externalExpenses?: ExternalExpense[];
  transportAsEssential?: boolean;
  userOverrides?: Record<string, ExpenseNature>;
}): AIAnalysisResult {
  const {
    transactions,
    includeExternal = false,
    externalExpenses = [],
    transportAsEssential = true,
    userOverrides = {},
  } = params;

  // Filter out bank invoice payment transactions and zero amounts
  const validTransactions = transactions.filter(
    (t) => t.category !== 'Pagamentos & Créditos' && t.amount > 0
  );

  const classifiedList: AIClassifiedTransaction[] = validTransactions.map((tx) => {
    const res = determineTransactionNature(tx, {
      transportAsEssential,
      overrides: userOverrides,
    });

    return {
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      bank: tx.bank,
      category: tx.category,
      classification: res.classification,
      confidence: res.confidence,
      reason: res.reason,
      isUserOverridden: res.isUserOverridden,
    };
  });

  // Calculate card totals
  let essentialSum = classifiedList
    .filter((t) => t.classification === 'essential')
    .reduce((s, t) => s + t.amount, 0);

  let variableSum = classifiedList
    .filter((t) => t.classification === 'variable')
    .reduce((s, t) => s + t.amount, 0);

  let essentialCount = classifiedList.filter((t) => t.classification === 'essential').length;
  let variableCount = classifiedList.filter((t) => t.classification === 'variable').length;

  // Optionally include external expenses (housing, utilities, tuition etc are overwhelmingly essential)
  if (includeExternal && externalExpenses.length > 0) {
    externalExpenses.forEach((ext) => {
      // By default external expenses (luz, água, aluguel, condomínio, faculdade) are essential
      const isOverride = userOverrides[`ext_${ext.id}`];
      const nature: ExpenseNature = isOverride ? isOverride : 'essential';

      if (nature === 'essential') {
        essentialSum += ext.amount;
        essentialCount += 1;
      } else {
        variableSum += ext.amount;
        variableCount += 1;
      }

      classifiedList.push({
        id: `ext_${ext.id}`,
        date: ext.dueDateDay ? `Dia ${ext.dueDateDay}` : 'Recorrente',
        description: `${ext.name} (Fora do Cartão)`,
        amount: ext.amount,
        bank: 'Fora do Cartão',
        category: ext.category || 'Contas Fixas',
        classification: nature,
        confidence: 0.99,
        reason: 'Despesa fixa estrutural de moradia e infraestrutura essencial',
        isUserOverridden: Boolean(isOverride),
      });
    });
  }

  const totalAnalyzed = essentialSum + variableSum;
  const essentialPct = totalAnalyzed > 0 ? (essentialSum / totalAnalyzed) * 100 : 0;
  const variablePct = totalAnalyzed > 0 ? (variableSum / totalAnalyzed) * 100 : 0;

  // Breakdown by Bank
  const bankMap: Record<
    string,
    { total: number; essential: number; variable: number; count: number }
  > = {};

  classifiedList.forEach((t) => {
    if (!bankMap[t.bank]) {
      bankMap[t.bank] = { total: 0, essential: 0, variable: 0, count: 0 };
    }
    bankMap[t.bank].total += t.amount;
    bankMap[t.bank].count += 1;
    if (t.classification === 'essential') {
      bankMap[t.bank].essential += t.amount;
    } else {
      bankMap[t.bank].variable += t.amount;
    }
  });

  const byBank: BankClassificationStats[] = Object.entries(bankMap).map(([bank, data]) => ({
    bank,
    total: data.total,
    essentialTotal: data.essential,
    variableTotal: data.variable,
    essentialPct: data.total > 0 ? (data.essential / data.total) * 100 : 0,
    variablePct: data.total > 0 ? (data.variable / data.total) * 100 : 0,
    transactionsCount: data.count,
  })).sort((a, b) => b.total - a.total);

  // Group by category within essential and variable
  const essentialCatMap: Record<string, { total: number; count: number }> = {};
  const variableCatMap: Record<string, { total: number; count: number }> = {};

  classifiedList.forEach((t) => {
    if (t.classification === 'essential') {
      if (!essentialCatMap[t.category]) essentialCatMap[t.category] = { total: 0, count: 0 };
      essentialCatMap[t.category].total += t.amount;
      essentialCatMap[t.category].count += 1;
    } else {
      if (!variableCatMap[t.category]) variableCatMap[t.category] = { total: 0, count: 0 };
      variableCatMap[t.category].total += t.amount;
      variableCatMap[t.category].count += 1;
    }
  });

  const topEssentialCategories: CategoryClassificationGroup[] = Object.entries(essentialCatMap)
    .map(([cat, d]) => ({
      category: cat,
      total: d.total,
      percentage: essentialSum > 0 ? (d.total / essentialSum) * 100 : 0,
      count: d.count,
      nature: 'essential' as ExpenseNature,
    }))
    .sort((a, b) => b.total - a.total);

  const topVariableCategories: CategoryClassificationGroup[] = Object.entries(variableCatMap)
    .map(([cat, d]) => ({
      category: cat,
      total: d.total,
      percentage: variableSum > 0 ? (d.total / variableSum) * 100 : 0,
      count: d.count,
      nature: 'variable' as ExpenseNature,
    }))
    .sort((a, b) => b.total - a.total);

  // Financial 50/30/20 Rule Comparison
  let statusTone: 'good' | 'warning' | 'alert' = 'warning';
  let statusLabel = 'Atenção aos Gastos Flexíveis';

  if (variablePct > 60) {
    statusTone = 'alert';
    statusLabel = 'Alerta: Elevada Concentração em Supérfluos';
  } else if (variablePct <= 45) {
    statusTone = 'good';
    statusLabel = 'Excelente Equilíbrio Orçamentário';
  }

  // AI Diagnostic Generation
  const highestVariableCat = topVariableCategories[0]?.category || 'Delivery & Compras';
  const highestVariableAmount = topVariableCategories[0]?.total || 0;
  const highestVariableShare = topVariableCategories[0]?.percentage || 0;

  const pct15 = variableSum * 0.15;
  const pct25 = variableSum * 0.25;
  const pct35 = variableSum * 0.35;
  const pct50 = variableSum * 0.50;
  const annualAt25Pct = pct25 * 12;

  const aiDiagnosis = {
    badge: 'Auditoria Cognitiva da I.A',
    title: `Diagnóstico: ${variablePct.toFixed(1)}% do cartão são Gastos Variáveis e ${essentialPct.toFixed(1)}% são Essenciais`,
    summary: `Através da varredura inteligente de ${classifiedList.length} lançamentos, detectamos que ${formatBRL(variableSum)} (${variablePct.toFixed(1)}%) foram aplicados em despesas variáveis e estilo de vida, enquanto ${formatBRL(essentialSum)} (${essentialPct.toFixed(1)}%) sustentam necessidades indispensáveis (alimentação básica, farmácia, transporte e telecomunicação).`,
    verdict: variablePct > 50
      ? `Mais da metade do seu cartão está comprometida com gastos discricionários. O maior foco está em ${highestVariableCat} (${formatBRL(highestVariableAmount)}, representando ${highestVariableShare.toFixed(1)}% de todos os seus gastos variáveis). Há uma oportunidade imediata de corte sem afetar seu bem-estar básico.`
      : `Seus gastos com cartão apresentam uma estrutura controlada, com a maior fatia preservada para despesas essenciais. Continue monitorando os desembolsos de oportunidade.`,
    highlights: [
      `Maior dreno de gastos variáveis: ${highestVariableCat} com ${formatBRL(highestVariableAmount)} (${highestVariableShare.toFixed(1)}% do total variável).`,
      `Pilar essencial dominante: ${topEssentialCategories[0]?.category || 'Transporte/Supermercado'} com ${formatBRL(topEssentialCategories[0]?.total || 0)}.`,
      `Diferencial por Banco: ${byBank[0]?.bank || 'Bradesco'} concentra o maior volume financeiro (${formatBRL(byBank[0]?.total || 0)}).`,
    ],
    actionTips: [
      `Economia Imediata: Reduzir 25% dos gastos de estilo de vida poupará ${formatBRL(pct25)} no mês que vem (${formatBRL(annualAt25Pct)} em 1 ano!).`,
      `Ajuste de Delivery: Estabelecer um teto semanal para iFood/restaurantes corta até 40% do custo desta categoria.`,
      `Revisão de Assinaturas: Verifique se todos os streamings e assinaturas ativas estão sendo aproveitados rotineiramente.`,
    ],
  };

  return {
    scope: includeExternal ? 'cards_plus_external' : 'cards_only',
    totalAnalyzed,
    essentialTotal: essentialSum,
    essentialPct,
    essentialCount,
    variableTotal: variableSum,
    variablePct,
    variableCount,
    benchmark503020: {
      recommendedEssentialMaxPct: 50,
      recommendedVariableMaxPct: 30,
      recommendedInvestPct: 20,
      essentialDifference: essentialPct - 50,
      variableDifference: variablePct - 30,
      statusLabel,
      statusTone,
    },
    byBank,
    topEssentialCategories,
    topVariableCategories,
    classifiedTransactions: classifiedList,
    aiDiagnosis,
    potentialSavings: {
      pct15,
      pct25,
      pct35,
      pct50,
      annualAt25Pct,
    },
  };
}
