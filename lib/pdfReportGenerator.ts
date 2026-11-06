import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DashboardSummary, 
  ParsedInvoice, 
  Transaction, 
  MonthlyFutureCommitment 
} from '@/lib/invoiceParser';
import { ExternalExpense } from '@/components/ExternalExpenses';
import { 
  AIAnalysisResult, 
  runAICardExpenseAnalysis 
} from '@/lib/aiExpenseClassifier';

export interface PdfReportOptions {
  title?: string;
  periodLabel?: string;
  includeKpis?: boolean;
  includeAiAnalysis?: boolean;
  includeBanksSummary?: boolean;
  includeCategoryBreakdown?: boolean;
  includeTopCompanies?: boolean;
  includeExternalExpenses?: boolean;
  includeFutureTimeline?: boolean;
  includeTransactions?: boolean;
  transactionFilter?: 'all' | 'above50' | 'parceled' | 'none';
  selectedBank?: string | null;
  fileName?: string;
}

export const DEFAULT_PDF_OPTIONS: PdfReportOptions = {
  title: 'FaturaFlow - Relatório Financeiro Executivo',
  periodLabel: 'Outubro / 2026',
  includeKpis: true,
  includeAiAnalysis: true,
  includeBanksSummary: true,
  includeCategoryBreakdown: true,
  includeTopCompanies: true,
  includeExternalExpenses: true,
  includeFutureTimeline: true,
  includeTransactions: true,
  transactionFilter: 'all',
  selectedBank: null,
};

/**
 * Formats a currency value cleanly for PDF text without unicode breaking-space issues
 */
export function formatPdfBRL(value: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

  // Replace non-breaking spaces (\u00A0) with standard space to avoid font encoding issues in jsPDF
  return formatted.replace(/\u00a0/g, ' ');
}

/**
 * Generates the full executive financial PDF report
 */
export function generateFinancialPdfReport({
  summary,
  externalExpenses = [],
  externalTotal = 0,
  invoices = [],
  aiAnalysis,
  options = {},
}: {
  summary: DashboardSummary;
  externalExpenses?: ExternalExpense[];
  externalTotal?: number;
  invoices?: ParsedInvoice[];
  aiAnalysis?: AIAnalysisResult;
  options?: Partial<PdfReportOptions>;
}): jsPDF {
  const opts: PdfReportOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight; // 182mm
  const totalPagesExp = '{total_pages_count_string}';

  // Compute AI Analysis if not provided
  const computedAi: AIAnalysisResult = aiAnalysis || runAICardExpenseAnalysis({
    transactions: summary.allTransactions,
    invoices,
    includeExternal: true,
    externalExpenses,
    transportAsEssential: true,
    userOverrides: {},
  });

  const grandTotal = summary.totalCurrentSpent + externalTotal;
  const creditCardTotal = summary.totalCurrentSpent;
  const cardPct = grandTotal > 0 ? (creditCardTotal / grandTotal) * 100 : 0;
  const externalPct = grandTotal > 0 ? (externalTotal / grandTotal) * 100 : 0;

  // Header and Running Footer Hook
  const applyPageDecoration = (data: { pageNumber: number }) => {
    // Top running header for page > 1
    if (data.pageNumber > 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft, 8, contentWidth, 8, 'F');
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, 16, pageWidth - marginRight, 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229); // indigo
      doc.text('FATURAFLOW', marginLeft + 3, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`•  Relatório Financeiro Consolidado (${opts.periodLabel})`, marginLeft + 28, 13);

      const emitText = `Pág. ${data.pageNumber} de ${totalPagesExp}`;
      doc.text(emitText, pageWidth - marginRight - 3, 13, { align: 'right' });
    }

    // Running footer for ALL pages
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'FaturaFlow  •  Relatório Financeiro Confidencial gerado localmente com IA & OCR',
      marginLeft,
      pageHeight - 7
    );

    const pageStr = `Página ${data.pageNumber} de ${totalPagesExp}`;
    doc.text(pageStr, pageWidth - marginRight, pageHeight - 7, { align: 'right' });
  };

  // Helper to ensure vertical room
  const ensureSpace = (neededMm: number) => {
    const currentY = (doc as any).lastAutoTable?.finalY || 20;
    if (currentY + neededMm > pageHeight - 20) {
      doc.addPage();
      return 22;
    }
    return currentY + 7;
  };

  // --------------------------------------------------------------------------
  // PAGE 1: COVER HEADER & EXECUTIVE KPIS
  // --------------------------------------------------------------------------
  let currentY = 14;

  // Banner Background (Slate-900 with subtle Indigo tone)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginLeft, currentY, contentWidth, 32, 3, 3, 'F');

  // Decorative Indigo Accent Bar on left
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.roundedRect(marginLeft, currentY, 4, 32, 2, 2, 'F');

  // Title inside banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FATURAFLOW', marginLeft + 8, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(165, 180, 252); // indigo-200
  doc.text('RELATÓRIO FINANCEIRO CONSOLIDADO & AUDITORIA DE GASTOS', marginLeft + 8, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `Período de Referência: ${opts.periodLabel}   |   ${invoices.length} Faturas Analisadas   |   ${externalExpenses.length} Despesas Fixas`,
    marginLeft + 8,
    currentY + 25
  );

  // Right-side badge
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('EMISSÃO:', pageWidth - marginRight - 8, currentY + 11, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(dateFormatted, pageWidth - marginRight - 8, currentY + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('STATUS: CONCILIADO', pageWidth - marginRight - 8, currentY + 25, { align: 'right' });

  currentY += 36;

  // --------------------------------------------------------------------------
  // EXECUTIVE KPIS (4 Box Grid)
  // --------------------------------------------------------------------------
  if (opts.includeKpis) {
    const cardGap = 3.5;
    const cardW = (contentWidth - cardGap * 3) / 4;
    const cardH = 22;

    const kpis = [
      {
        title: 'TOTAL GASTO GERAL',
        value: formatPdfBRL(grandTotal),
        sub: `Cartões + Despesas Fixas`,
        bg: [238, 242, 255], // indigo-50
        border: [199, 210, 254],
        textColor: [67, 56, 202],
      },
      {
        title: 'FATURAS DOS CARTÕES',
        value: formatPdfBRL(creditCardTotal),
        sub: `${cardPct.toFixed(1)}% do total consolidado`,
        bg: [255, 241, 242], // rose-50
        border: [254, 205, 211],
        textColor: [190, 18, 60],
      },
      {
        title: 'DESPESAS FORA DO CARTÃO',
        value: formatPdfBRL(externalTotal),
        sub: `${externalPct.toFixed(1)}% do total consolidado`,
        bg: [254, 243, 199], // amber-50
        border: [253, 230, 138],
        textColor: [180, 83, 9],
      },
      {
        title: 'COMPROMETIMENTO FUTURO',
        value: formatPdfBRL(summary.totalFutureCommitted),
        sub: `Saldo a vencer parcelado`,
        bg: [240, 253, 244], // emerald-50
        border: [187, 247, 208],
        textColor: [21, 128, 61],
      },
    ];

    kpis.forEach((kpi, index) => {
      const x = marginLeft + index * (cardW + cardGap);
      doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
      doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
      doc.text(kpi.title, x + 3.5, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.value, x + 3.5, currentY + 12.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.sub, x + 3.5, currentY + 18);
    });

    currentY += cardH + 6;
  }

  // --------------------------------------------------------------------------
  // SECTION: ANÁLISE IA (ESSENCIAIS VS VARIÁVEIS)
  // --------------------------------------------------------------------------
  if (opts.includeAiAnalysis) {
    doc.setFillColor(245, 243, 255); // violet-50
    doc.setDrawColor(221, 214, 254);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginLeft, currentY, contentWidth, 27, 2.5, 2.5, 'FD');

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(109, 40, 217); // violet-700
    doc.text('AUDITORIA DE INTELIGÊNCIA ARTIFICIAL: ESSENCIAL VS VARIÁVEL (REGRA 50/30/20)', marginLeft + 5, currentY + 6);

    // Left block: Essenciais
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Gastos Essenciais (Sobrevivência):', marginLeft + 5, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(
      `${formatPdfBRL(computedAi.essentialTotal)} (${computedAi.essentialPct.toFixed(1)}%)`,
      marginLeft + 5,
      currentY + 18
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Meta ideal: até 50% (${computedAi.benchmark503020.essentialDifference >= 0 ? '+' : ''}${computedAi.benchmark503020.essentialDifference.toFixed(1)}% do teto)`,
      marginLeft + 5,
      currentY + 23
    );

    // Center block: Variáveis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Gastos Variáveis / Estilo de Vida:', marginLeft + 70, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(244, 63, 94); // rose
    doc.text(
      `${formatPdfBRL(computedAi.variableTotal)} (${computedAi.variablePct.toFixed(1)}%)`,
      marginLeft + 70,
      currentY + 18
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Meta ideal: até 30% (${computedAi.benchmark503020.variableDifference >= 0 ? '+' : ''}${computedAi.benchmark503020.variableDifference.toFixed(1)}% do teto)`,
      marginLeft + 70,
      currentY + 23
    );

    // Right block: Potencial de Economia
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Oportunidade de Poupança:', marginLeft + 130, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(79, 70, 229); // indigo
    doc.text(
      `+ ${formatPdfBRL(computedAi.potentialSavings.pct25)} /mês`,
      marginLeft + 130,
      currentY + 18
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Equivale a ${formatPdfBRL(computedAi.potentialSavings.annualAt25Pct)} /ano (corte de 25%)`,
      marginLeft + 130,
      currentY + 23
    );

    currentY += 32;
  }

  // --------------------------------------------------------------------------
  // SECTION: BANCOS & CARTÕES DETALHADOS
  // --------------------------------------------------------------------------
  if (opts.includeBanksSummary && invoices.length > 0) {
    const bankRows = invoices.map((inv) => {
      const sharePct = summary.totalCurrentSpent > 0 ? (inv.totalCurrent / summary.totalCurrentSpent) * 100 : 0;
      return [
        inv.bank,
        inv.cardHolder || 'Titular',
        inv.dueDate || '10/11/2026',
        formatPdfBRL(inv.totalCurrent),
        `${sharePct.toFixed(1)}%`,
        formatPdfBRL(inv.limitTotal || 0),
        formatPdfBRL(inv.limitAvailable || 0),
        formatPdfBRL(inv.totalFuture || 0),
      ];
    });

    // Add total row
    bankRows.push([
      'TOTAL CARTÕES',
      `${invoices.length} Faturas`,
      '-',
      formatPdfBRL(summary.totalCurrentSpent),
      '100.0%',
      formatPdfBRL(summary.totalCombinedLimit),
      formatPdfBRL(summary.totalLimitAvailable),
      formatPdfBRL(summary.totalFutureCommitted),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: 20, bottom: 18 },
      head: [[
        'Instituição / Banco',
        'Titular',
        'Vencimento',
        'Fatura Atual',
        '% Cartões',
        'Limite Total',
        'Limite Livre',
        'Futuro Parcelado',
      ]],
      body: bankRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 26 },
        2: { cellWidth: 20, halign: 'center' },
        3: { fontStyle: 'bold', halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 23 },
        6: { halign: 'right', cellWidth: 23 },
        7: { fontStyle: 'bold', halign: 'right', cellWidth: 24 },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        // Highlight total row
        if (data.row.index === bankRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          if (data.column.index === 3) {
            data.cell.styles.textColor = [190, 18, 60]; // rose
          }
        }
      },
      didDrawPage: applyPageDecoration,
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // --------------------------------------------------------------------------
  // SECTION: TOP EMPRESAS & CATEGORIAS (2-Columns or Sequence)
  // --------------------------------------------------------------------------
  if (opts.includeTopCompanies && summary.companySpending?.length > 0) {
    currentY = ensureSpace(45);

    // Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('MAIORES GASTOS POR ESTABELECIMENTO / EMPRESA (TOP 10)', marginLeft, currentY - 2);

    const top10Companies = summary.companySpending.slice(0, 10).map((c, i) => [
      `#${i + 1} ${c.name}`,
      c.category,
      `${c.transactionCount}x`,
      formatPdfBRL(c.averageTicket),
      formatPdfBRL(c.totalSpent),
      `${c.percentageOfTotal.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: 20, bottom: 18 },
      head: [['Estabelecimento / Fornecedor', 'Categoria', 'Compras', 'Ticket Médio', 'Total Gasto', '% do Total']],
      body: top10Companies,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 42 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 26 },
        4: { fontStyle: 'bold', halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 20 },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: applyPageDecoration,
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // --------------------------------------------------------------------------
  // SECTION: DESPESAS FORA DO CARTÃO (CONTAS FIXAS)
  // --------------------------------------------------------------------------
  if (opts.includeExternalExpenses && externalExpenses.length > 0) {
    currentY = ensureSpace(45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('DESPESAS FIXAS FORA DO CARTÃO (CONTAS DE CONSUMO & MORADIA)', marginLeft, currentY - 2);

    const extRows = externalExpenses.map((e) => [
      e.name,
      e.category,
      e.dueDateDay ? `Dia ${e.dueDateDay}` : 'Mês atual',
      formatPdfBRL(e.amount),
      e.status === 'paid' ? 'Pago' : 'Pendente',
      grandTotal > 0 ? `${((e.amount / grandTotal) * 100).toFixed(1)}%` : '0%',
    ]);

    extRows.push([
      'TOTAL CONTAS FIXAS',
      `${externalExpenses.length} Despesas`,
      '-',
      formatPdfBRL(externalTotal),
      '-',
      `${externalPct.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: 20, bottom: 18 },
      head: [['Despesa / Conta', 'Categoria', 'Vencimento', 'Valor', 'Status', '% Geral']],
      body: extRows,
      theme: 'grid',
      headStyles: {
        fillColor: [217, 119, 6], // amber-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 42 },
        2: { halign: 'center', cellWidth: 26 },
        3: { fontStyle: 'bold', halign: 'right', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 18 },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [254, 252, 232], // amber-50
      },
      didParseCell: (data) => {
        if (data.row.index === extRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
        }
      },
      didDrawPage: applyPageDecoration,
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // --------------------------------------------------------------------------
  // SECTION: PROJEÇÃO FUTURA (LINHA DO TEMPO)
  // --------------------------------------------------------------------------
  if (opts.includeFutureTimeline && summary.monthlyTimeline?.length > 0) {
    currentY = ensureSpace(45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('PROJEÇÃO DE PARCELAS FUTURAS (LINHA DO TEMPO DOS CARTÕES)', marginLeft, currentY - 2);

    const timelineRows = summary.monthlyTimeline.map((m) => [
      m.monthLabel,
      formatPdfBRL(m.byBank['Bradesco'] || 0),
      formatPdfBRL(m.byBank['Itaú'] || 0),
      formatPdfBRL(m.byBank['Nubank'] || 0),
      formatPdfBRL(m.byBank['Caixa'] || 0),
      formatPdfBRL(m.amount),
    ]);

    timelineRows.push([
      'TOTAL PARCELADO FUTURO',
      '-',
      '-',
      '-',
      '-',
      formatPdfBRL(summary.totalFutureCommitted),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: 20, bottom: 18 },
      head: [['Mês / Ano', 'Bradesco', 'Itaú', 'Nubank', 'Caixa', 'Total Projetado']],
      body: timelineRows,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // indigo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 },
        5: { fontStyle: 'bold', halign: 'right', cellWidth: 30 },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.row.index === timelineRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      didDrawPage: applyPageDecoration,
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // --------------------------------------------------------------------------
  // SECTION: EXTRATO COMPLETO DE TRANSAÇÕES
  // --------------------------------------------------------------------------
  if (opts.includeTransactions && summary.allTransactions?.length > 0) {
    // Filter transactions if requested
    let txs = summary.allTransactions;

    if (opts.selectedBank) {
      txs = txs.filter((t) => t.bank === opts.selectedBank);
    }

    if (opts.transactionFilter === 'above50') {
      txs = txs.filter((t) => t.amount >= 50);
    } else if (opts.transactionFilter === 'parceled') {
      txs = txs.filter((t) => t.installment && t.installment.total > 1);
    }

    if (txs.length > 0) {
      // Start transactions on a fresh page for clean layout if current page is crowded
      const currentHeight = (doc as any).lastAutoTable?.finalY || 30;
      if (currentHeight > 120) {
        doc.addPage();
        currentY = 22;
      } else {
        currentY = ensureSpace(40);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `EXTRATO DETALHADO DE LANÇAMENTOS (${txs.length} ITENS INCLUÍDOS)`,
        marginLeft,
        currentY - 2
      );

      const txRows = txs.map((t) => {
        const installmentText = t.installment 
          ? `${t.installment.current}/${t.installment.total}` 
          : 'À vista';
        return [
          t.date,
          t.description,
          t.bank,
          t.category,
          installmentText,
          formatPdfBRL(t.amount),
        ];
      });

      const totalTxsAmount = txs.reduce((acc, t) => acc + t.amount, 0);
      txRows.push([
        'TOTAL',
        `${txs.length} lançamentos listados`,
        opts.selectedBank || 'Todos os Bancos',
        '-',
        '-',
        formatPdfBRL(totalTxsAmount),
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: marginLeft, right: marginRight, top: 20, bottom: 18 },
        head: [['Data', 'Descrição / Estabelecimento', 'Banco', 'Categoria', 'Parcela', 'Valor']],
        body: txRows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 62 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 38 },
          4: { cellWidth: 18, halign: 'center' },
          5: { fontStyle: 'bold', halign: 'right', cellWidth: 22 },
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          textColor: [30, 41, 59],
          overflow: 'linebreak',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: (data) => {
          if (data.row.index === txRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [226, 232, 240];
            data.cell.styles.textColor = [15, 23, 42];
          }
        },
        didDrawPage: applyPageDecoration,
      });
    }
  }

  // Replace total pages placeholder string across the entire document
  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages(totalPagesExp);
  }

  return doc;
}

/**
 * Generates and triggers automatic download of the PDF file in browser
 */
export function downloadFinancialPdfReport(params: {
  summary: DashboardSummary;
  externalExpenses?: ExternalExpense[];
  externalTotal?: number;
  invoices?: ParsedInvoice[];
  aiAnalysis?: AIAnalysisResult;
  options?: Partial<PdfReportOptions>;
}): string {
  const doc = generateFinancialPdfReport(params);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fileName = params.options?.fileName || `FaturaFlow_Relatorio_Executivo_${dateStr}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Generates and opens the PDF in a new tab for preview/printing
 */
export function previewFinancialPdfReport(params: {
  summary: DashboardSummary;
  externalExpenses?: ExternalExpense[];
  externalTotal?: number;
  invoices?: ParsedInvoice[];
  aiAnalysis?: AIAnalysisResult;
  options?: Partial<PdfReportOptions>;
}): void {
  const doc = generateFinancialPdfReport(params);
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}
