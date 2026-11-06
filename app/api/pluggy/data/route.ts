import { NextRequest, NextResponse } from 'next/server';
import {
  createPluggyServerClient,
  getPluggyCredentials,
  getDemoOpenFinanceData,
  computeOpenFinanceSummary,
  OpenFinanceItemConnection,
  OpenFinanceAccount,
  OpenFinanceTransaction,
  OpenFinanceInvestment,
} from '@/lib/pluggyClient';
import { categorizeTransaction } from '@/lib/invoiceParser';

async function resolveOpenFinanceData(
  itemIds: string[],
  overrideClientId?: string,
  overrideClientSecret?: string
) {
  const creds = getPluggyCredentials(overrideClientId, overrideClientSecret);

  // Se não houver credenciais ou nenhum item conectado ainda, retorna os dados de demonstração enriquecidos
  if (!creds.isConfigured || itemIds.length === 0) {
    const demo = getDemoOpenFinanceData();
    demo.hasConfiguredCredentials = creds.isConfigured;
    return demo;
  }

  const client = createPluggyServerClient(creds.clientId, creds.clientSecret);
  if (!client) {
    return getDemoOpenFinanceData();
  }

  const connections: OpenFinanceItemConnection[] = [];
  const accounts: OpenFinanceAccount[] = [];
  const transactions: OpenFinanceTransaction[] = [];
  const investments: OpenFinanceInvestment[] = [];

  for (const itemId of itemIds) {
    try {
      const item = await client.fetchItem(itemId);
      const institutionName = item.connector?.name || 'Instituição Open Finance';
      const primaryColor = item.connector?.primaryColor
        ? `#${item.connector.primaryColor.replace('#', '')}`
        : '#6366f1';

      connections.push({
        id: item.id,
        connectorId: item.connector?.id || 0,
        institutionName,
        institutionLogoText: institutionName.slice(0, 2).toUpperCase(),
        primaryColor,
        status: (item.status as OpenFinanceItemConnection['status']) || 'UPDATED',
        executionStatus: item.executionStatus || 'SUCCESS',
        lastUpdatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
        consentExpiresAt: item.createdAt
          ? new Date(new Date(item.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        products: (item.connector?.products as OpenFinanceItemConnection['products']) || [
          'ACCOUNTS',
          'CREDIT_CARDS',
          'TRANSACTIONS',
        ],
        isSandbox: Boolean(item.connector?.isSandbox),
      });

      // Buscar contas bancárias e de cartão daquele Item
      const accPage = await client.fetchAccounts(itemId);
      for (const acc of accPage.results || []) {
        accounts.push({
          id: acc.id,
          itemId,
          institutionName,
          institutionColor: primaryColor,
          type: acc.type === 'CREDIT' ? 'CREDIT' : 'BANK',
          subtype:
            acc.subtype === 'CREDIT_CARD'
              ? 'CREDIT_CARD'
              : acc.subtype === 'SAVINGS_ACCOUNT'
              ? 'SAVINGS_ACCOUNT'
              : 'CHECKING_ACCOUNT',
          name: acc.name || institutionName,
          number: acc.number || '••••',
          balance: Number(acc.balance || 0),
          currencyCode: acc.currencyCode || 'BRL',
          creditData: acc.creditData
            ? {
                level: acc.creditData.level || 'Standard',
                brand: acc.creditData.brand || 'CARD',
                balanceCloseDate: acc.creditData.balanceCloseDate
                  ? new Date(acc.creditData.balanceCloseDate).toISOString().slice(0, 10)
                  : '',
                balanceDueDate: acc.creditData.balanceDueDate
                  ? new Date(acc.creditData.balanceDueDate).toISOString().slice(0, 10)
                  : '',
                availableCreditLimit: Number(acc.creditData.availableCreditLimit || 0),
                minimumPayment: Number(acc.creditData.minimumPayment || 0),
                creditLimit: Number(acc.creditData.creditLimit || 0),
              }
            : undefined,
        });

        // Buscar transações recentes dessa conta
        try {
          const txPage = await client.fetchTransactions(acc.id, { pageSize: 30 });
          for (const tx of txPage.results || []) {
            const rawDesc = tx.description || tx.descriptionRaw || 'Lançamento Open Finance';
            const absAmount = Math.abs(Number(tx.amount || 0));
            const isCredit = tx.type === 'CREDIT' || Number(tx.amount) > 0;

            let paymentMethod: OpenFinanceTransaction['paymentMethod'] = 'TRANSFER';
            if (acc.type === 'CREDIT') {
              paymentMethod = 'CREDIT_CARD';
            } else if (/pix/i.test(rawDesc) || tx.paymentData?.paymentMethod === 'PIX') {
              paymentMethod = 'PIX';
            } else if (/boleto/i.test(rawDesc)) {
              paymentMethod = 'BOLETO';
            }

            transactions.push({
              id: tx.id,
              accountId: acc.id,
              institutionName,
              description: rawDesc,
              amount: absAmount,
              date: tx.date ? new Date(tx.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              type: isCredit && acc.type !== 'CREDIT' ? 'CREDIT' : 'DEBIT',
              category: categorizeTransaction(rawDesc),
              pluggyCategory: tx.category || undefined,
              paymentMethod,
              status: tx.status === 'PENDING' ? 'PENDING' : 'POSTED',
              installment:
                tx.creditCardMetadata?.installmentNumber && tx.creditCardMetadata?.totalInstallments
                  ? {
                      number: tx.creditCardMetadata.installmentNumber,
                      total: tx.creditCardMetadata.totalInstallments,
                    }
                  : undefined,
            });
          }
        } catch {
          // Segue caso uma conta não possua transações
        }
      }

      // Buscar investimentos do Item
      try {
        const invPage = await client.fetchInvestments(itemId);
        for (const inv of invPage.results || []) {
          investments.push({
            id: inv.id,
            itemId,
            institutionName,
            name: inv.name || 'Investimento Open Finance',
            code: inv.code || inv.id.slice(0, 8).toUpperCase(),
            type: (inv.type as OpenFinanceInvestment['type']) || 'FIXED_INCOME',
            subtype: inv.subtype || 'Renda Fixa',
            balance: Number(inv.balance || 0),
            amountOriginal: Number(inv.amountOriginal || inv.balance || 0),
            profitabilityMonth: Number(inv.lastMonthRate || 0.9),
            profitabilityYear: Number(inv.annualRate || 11.2),
            rateLabel: inv.rate ? `${inv.rate}% CDI` : 'Pós-Fixado CDI',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : undefined,
            status: inv.status === 'TOTAL_WITHDRAWAL' ? 'TOTAL_WITHDRAWAL' : 'ACTIVE',
          });
        }
      } catch {
        // Segue caso o item não tenha permissão ou dados de investimento
      }
    } catch {
      // Se um itemId falhar, continua nos próximos
    }
  }

  // Se nenhum item retornou dados reais na chamada, faz fallback gracioso para o modo demo
  if (connections.length === 0) {
    const fallback = getDemoOpenFinanceData();
    fallback.hasConfiguredCredentials = creds.isConfigured;
    return fallback;
  }

  // Ordenar transações por data mais recente
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return computeOpenFinanceSummary('live', creds.isConfigured, connections, accounts, transactions, investments);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemsParam = searchParams.get('itemIds') || '';
    const itemIds = itemsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const data = await resolveOpenFinanceData(itemIds);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao consultar dados Open Finance';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemIds: string[] = Array.isArray(body.itemIds) ? body.itemIds : [];
    const { clientId, clientSecret } = body;

    const data = await resolveOpenFinanceData(itemIds, clientId, clientSecret);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar dados Open Finance';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
