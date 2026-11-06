import { PluggyClient } from 'pluggy-sdk';
import { categorizeTransaction } from './invoiceParser';

export interface OpenFinanceAccount {
  id: string;
  itemId: string;
  institutionName: string;
  institutionColor: string;
  type: 'BANK' | 'CREDIT';
  subtype: 'CHECKING_ACCOUNT' | 'SAVINGS_ACCOUNT' | 'CREDIT_CARD';
  name: string;
  number: string;
  balance: number;
  currencyCode: string;
  creditData?: {
    level: string;
    brand: string;
    balanceCloseDate: string;
    balanceDueDate: string;
    availableCreditLimit: number;
    balanceForeignCurrency?: number;
    minimumPayment: number;
    creditLimit: number;
  };
}

export interface OpenFinanceTransaction {
  id: string;
  accountId: string;
  institutionName: string;
  description: string;
  amount: number;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  category: string;
  pluggyCategory?: string;
  paymentMethod?: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'TRANSFER';
  status: 'POSTED' | 'PENDING';
  installment?: {
    number: number;
    total: number;
  };
}

export interface OpenFinanceInvestment {
  id: string;
  itemId: string;
  institutionName: string;
  name: string;
  code: string;
  type: 'FIXED_INCOME' | 'MUTUAL_FUND' | 'EQUITY' | 'TREASURY' | 'ETF';
  subtype: string;
  balance: number;
  amountOriginal: number;
  profitabilityMonth: number;
  profitabilityYear: number;
  rateLabel: string;
  dueDate?: string;
  status: 'ACTIVE' | 'TOTAL_WITHDRAWAL';
}

export interface OpenFinanceItemConnection {
  id: string;
  connectorId: number;
  institutionName: string;
  institutionLogoText: string;
  primaryColor: string;
  status: 'UPDATED' | 'UPDATING' | 'WAITING_USER_INPUT' | 'LOGIN_ERROR';
  executionStatus: string;
  lastUpdatedAt: string;
  consentExpiresAt: string;
  products: ('ACCOUNTS' | 'CREDIT_CARDS' | 'TRANSACTIONS' | 'INVESTMENTS' | 'IDENTITY')[];
  isSandbox: boolean;
}

export interface OpenFinanceDashboardData {
  mode: 'live' | 'sandbox_demo';
  hasConfiguredCredentials: boolean;
  connections: OpenFinanceItemConnection[];
  accounts: OpenFinanceAccount[];
  transactions: OpenFinanceTransaction[];
  investments: OpenFinanceInvestment[];
  summary: {
    totalCheckingBalance: number;
    totalSavingsBalance: number;
    totalInvestmentsBalance: number;
    totalCreditCardInvoice: number;
    totalCreditLimit: number;
    totalCreditAvailable: number;
    netWorth: number; // Saldo em conta + Investimentos - Faturas atuais
    monthlyPixOutflow: number;
    monthlyPixInflow: number;
  };
}

export function getPluggyCredentials(overrideClientId?: string, overrideClientSecret?: string) {
  const clientId = overrideClientId || process.env.PLUGGY_CLIENT_ID || '';
  const clientSecret = overrideClientSecret || process.env.PLUGGY_CLIENT_SECRET || '';
  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    isConfigured: Boolean(clientId.trim() && clientSecret.trim()),
  };
}

export function createPluggyServerClient(overrideClientId?: string, overrideClientSecret?: string): PluggyClient | null {
  const { clientId, clientSecret, isConfigured } = getPluggyCredentials(overrideClientId, overrideClientSecret);
  if (!isConfigured) return null;
  return new PluggyClient({
    clientId,
    clientSecret,
  });
}

// Dados realistas sincronizados com o perfil financeiro das faturas do app (Nubank, Itaú, Bradesco)
export function getDemoOpenFinanceData(): OpenFinanceDashboardData {
  const connections: OpenFinanceItemConnection[] = [
    {
      id: 'item-pluggy-nubank-001',
      connectorId: 212,
      institutionName: 'Nubank',
      institutionLogoText: 'Nu',
      primaryColor: '#820ad1',
      status: 'UPDATED',
      executionStatus: 'SUCCESS',
      lastUpdatedAt: '2026-11-05T23:15:00-03:00',
      consentExpiresAt: '2027-11-05T23:15:00-03:00',
      products: ['ACCOUNTS', 'CREDIT_CARDS', 'TRANSACTIONS', 'INVESTMENTS', 'IDENTITY'],
      isSandbox: true,
    },
    {
      id: 'item-pluggy-itau-002',
      connectorId: 201,
      institutionName: 'Itaú Unibanco',
      institutionLogoText: 'It',
      primaryColor: '#ec7000',
      status: 'UPDATED',
      executionStatus: 'SUCCESS',
      lastUpdatedAt: '2026-11-05T23:10:00-03:00',
      consentExpiresAt: '2027-11-05T23:10:00-03:00',
      products: ['ACCOUNTS', 'CREDIT_CARDS', 'TRANSACTIONS', 'INVESTMENTS'],
      isSandbox: true,
    },
    {
      id: 'item-pluggy-bradesco-003',
      connectorId: 203,
      institutionName: 'Bradesco',
      institutionLogoText: 'Br',
      primaryColor: '#cc092f',
      status: 'UPDATED',
      executionStatus: 'SUCCESS',
      lastUpdatedAt: '2026-11-05T23:05:00-03:00',
      consentExpiresAt: '2027-11-05T23:05:00-03:00',
      products: ['ACCOUNTS', 'CREDIT_CARDS', 'TRANSACTIONS', 'INVESTMENTS'],
      isSandbox: true,
    },
  ];

  const accounts: OpenFinanceAccount[] = [
    {
      id: 'acc-nu-checking',
      itemId: 'item-pluggy-nubank-001',
      institutionName: 'Nubank',
      institutionColor: '#820ad1',
      type: 'BANK',
      subtype: 'CHECKING_ACCOUNT',
      name: 'NuConta (Conta de Pagamento)',
      number: '0001 / 849201-5',
      balance: 4850.40,
      currencyCode: 'BRL',
    },
    {
      id: 'acc-nu-credit',
      itemId: 'item-pluggy-nubank-001',
      institutionName: 'Nubank',
      institutionColor: '#820ad1',
      type: 'CREDIT',
      subtype: 'CREDIT_CARD',
      name: 'Nubank Ultravioleta / Gold (•••• 0065)',
      number: '•••• 0065',
      balance: 1219.92,
      currencyCode: 'BRL',
      creditData: {
        level: 'Gold',
        brand: 'MASTERCARD',
        balanceCloseDate: '2026-10-06',
        balanceDueDate: '2026-10-13',
        availableCreditLimit: 1280.09,
        minimumPayment: 182.98,
        creditLimit: 4350.01,
      },
    },
    {
      id: 'acc-itau-checking',
      itemId: 'item-pluggy-itau-002',
      institutionName: 'Itaú Unibanco',
      institutionColor: '#ec7000',
      type: 'BANK',
      subtype: 'CHECKING_ACCOUNT',
      name: 'Conta Corrente Itaú Uniclass',
      number: 'Ag 1402 / CC 49102-8',
      balance: 6420.15,
      currencyCode: 'BRL',
    },
    {
      id: 'acc-itau-credit',
      itemId: 'item-pluggy-itau-002',
      institutionName: 'Itaú Unibanco',
      institutionColor: '#ec7000',
      type: 'CREDIT',
      subtype: 'CREDIT_CARD',
      name: 'Itaú Click / Uniclass Visa (•••• 8912)',
      number: '•••• 8912',
      balance: 2295.07,
      currencyCode: 'BRL',
      creditData: {
        level: 'Platinum',
        brand: 'VISA',
        balanceCloseDate: '2026-10-08',
        balanceDueDate: '2026-10-15',
        availableCreditLimit: 5104.93,
        minimumPayment: 344.26,
        creditLimit: 7400.00,
      },
    },
    {
      id: 'acc-brad-checking',
      itemId: 'item-pluggy-bradesco-003',
      institutionName: 'Bradesco',
      institutionColor: '#cc092f',
      type: 'BANK',
      subtype: 'CHECKING_ACCOUNT',
      name: 'Conta Corrente Bradesco Prime',
      number: 'Ag 0412 / CC 11890-2',
      balance: 3190.80,
      currencyCode: 'BRL',
    },
    {
      id: 'acc-brad-credit',
      itemId: 'item-pluggy-bradesco-003',
      institutionName: 'Bradesco',
      institutionColor: '#cc092f',
      type: 'CREDIT',
      subtype: 'CREDIT_CARD',
      name: 'Bradesco Elo Nanquim / Visa (•••• 4410)',
      number: '•••• 4410',
      balance: 7936.62,
      currencyCode: 'BRL',
      creditData: {
        level: 'Nanquim',
        brand: 'ELO',
        balanceCloseDate: '2026-10-18',
        balanceDueDate: '2026-10-25',
        availableCreditLimit: 9398.83,
        minimumPayment: 1190.49,
        creditLimit: 21000.00,
      },
    },
  ];

  const transactions: OpenFinanceTransaction[] = [
    {
      id: 'tx-of-01',
      accountId: 'acc-itau-checking',
      institutionName: 'Itaú Unibanco',
      description: 'TED / PIX Recebido - Remuneração Mensal',
      amount: 14500.00,
      date: '2026-11-05',
      type: 'CREDIT',
      category: 'Receitas & Salário',
      pluggyCategory: 'Salary',
      paymentMethod: 'PIX',
      status: 'POSTED',
    },
    {
      id: 'tx-of-02',
      accountId: 'acc-itau-checking',
      institutionName: 'Itaú Unibanco',
      description: 'Débito Automático - Energisa / Conta de Luz',
      amount: 730.00,
      date: '2026-11-04',
      type: 'DEBIT',
      category: 'Contas de Consumo',
      pluggyCategory: 'Utilities',
      paymentMethod: 'BOLETO',
      status: 'POSTED',
    },
    {
      id: 'tx-of-03',
      accountId: 'acc-nu-checking',
      institutionName: 'Nubank',
      description: 'PIX Enviado - Condomínio Residencial',
      amount: 287.22,
      date: '2026-11-04',
      type: 'DEBIT',
      category: 'Moradia',
      pluggyCategory: 'Housing',
      paymentMethod: 'PIX',
      status: 'POSTED',
    },
    {
      id: 'tx-of-04',
      accountId: 'acc-brad-checking',
      institutionName: 'Bradesco',
      description: 'Financiamento Imobiliário Habitacional',
      amount: 535.00,
      date: '2026-11-03',
      type: 'DEBIT',
      category: 'Moradia',
      pluggyCategory: 'Loans & Financing',
      paymentMethod: 'BOLETO',
      status: 'POSTED',
    },
    {
      id: 'tx-of-05',
      accountId: 'acc-nu-checking',
      institutionName: 'Nubank',
      description: 'PIX Enviado - Águas Guariroba (Saneamento)',
      amount: 177.00,
      date: '2026-11-03',
      type: 'DEBIT',
      category: 'Contas de Consumo',
      pluggyCategory: 'Utilities',
      paymentMethod: 'PIX',
      status: 'POSTED',
    },
    {
      id: 'tx-of-06',
      accountId: 'acc-nu-credit',
      institutionName: 'Nubank',
      description: 'Fort Atacadista - Supermercado',
      amount: 642.18,
      date: '2026-11-02',
      type: 'DEBIT',
      category: categorizeTransaction('Fort Atacadista'),
      pluggyCategory: 'Groceries',
      paymentMethod: 'CREDIT_CARD',
      status: 'POSTED',
    },
    {
      id: 'tx-of-07',
      accountId: 'acc-brad-credit',
      institutionName: 'Bradesco',
      description: 'Havan Loja de Departamentos - Parcela 3/10',
      amount: 318.90,
      date: '2026-11-02',
      type: 'DEBIT',
      category: categorizeTransaction('Havan'),
      pluggyCategory: 'Shopping',
      paymentMethod: 'CREDIT_CARD',
      status: 'POSTED',
      installment: { number: 3, total: 10 },
    },
    {
      id: 'tx-of-08',
      accountId: 'acc-itau-credit',
      institutionName: 'Itaú Unibanco',
      description: 'iFood *Restaurante Torquatus',
      amount: 114.50,
      date: '2026-11-01',
      type: 'DEBIT',
      category: categorizeTransaction('iFood Torquatus'),
      pluggyCategory: 'Eating Out',
      paymentMethod: 'CREDIT_CARD',
      status: 'POSTED',
    },
    {
      id: 'tx-of-09',
      accountId: 'acc-nu-checking',
      institutionName: 'Nubank',
      description: 'PIX Recebido - Reembolso Despesas Compartilhadas',
      amount: 850.00,
      date: '2026-10-30',
      type: 'CREDIT',
      category: 'Transferências & PIX',
      pluggyCategory: 'Transfers',
      paymentMethod: 'PIX',
      status: 'POSTED',
    },
    {
      id: 'tx-of-10',
      accountId: 'acc-nu-checking',
      institutionName: 'Nubank',
      description: 'Pagamento Fatura Cartão Nubank',
      amount: 1219.92,
      date: '2026-10-28',
      type: 'DEBIT',
      category: 'Pagamentos & Créditos',
      pluggyCategory: 'Credit Card Payment',
      paymentMethod: 'TRANSFER',
      status: 'POSTED',
    },
    {
      id: 'tx-of-11',
      accountId: 'acc-itau-checking',
      institutionName: 'Itaú Unibanco',
      description: 'PIX Enviado - Curso de Inglês Mensalidade',
      amount: 350.00,
      date: '2026-10-27',
      type: 'DEBIT',
      category: 'Educação',
      pluggyCategory: 'Education',
      paymentMethod: 'PIX',
      status: 'POSTED',
    },
    {
      id: 'tx-of-12',
      accountId: 'acc-brad-credit',
      institutionName: 'Bradesco',
      description: 'Drogasil Farmácia e Manipulação',
      amount: 189.40,
      date: '2026-10-26',
      type: 'DEBIT',
      category: categorizeTransaction('Drogasil'),
      pluggyCategory: 'Healthcare',
      paymentMethod: 'CREDIT_CARD',
      status: 'POSTED',
    },
  ];

  const investments: OpenFinanceInvestment[] = [
    {
      id: 'inv-pluggy-01',
      itemId: 'item-pluggy-nubank-001',
      institutionName: 'Nubank',
      name: 'Caixinha Reserva de Emergência (RDB)',
      code: 'RDB-NU-100CDI',
      type: 'FIXED_INCOME',
      subtype: 'CDB / RDB Liquidez Diária',
      balance: 18450.00,
      amountOriginal: 16500.00,
      profitabilityMonth: 0.94,
      profitabilityYear: 11.45,
      rateLabel: '100% do CDI',
      status: 'ACTIVE',
    },
    {
      id: 'inv-pluggy-02',
      itemId: 'item-pluggy-itau-002',
      institutionName: 'Itaú Unibanco',
      name: 'CDB Itaú DI Liquidez Diária',
      code: 'CDB-ITAU-DI',
      type: 'FIXED_INCOME',
      subtype: 'CDB Pós-Fixado',
      balance: 12300.50,
      amountOriginal: 11000.00,
      profitabilityMonth: 0.96,
      profitabilityYear: 11.68,
      rateLabel: '101,5% do CDI',
      dueDate: '2028-10-15',
      status: 'ACTIVE',
    },
    {
      id: 'inv-pluggy-03',
      itemId: 'item-pluggy-bradesco-003',
      institutionName: 'Bradesco',
      name: 'LCI Bradesco Imobiliário Isento IR',
      code: 'LCI-BRAD-94CDI',
      type: 'FIXED_INCOME',
      subtype: 'LCI (Isento de IR)',
      balance: 9820.00,
      amountOriginal: 9000.00,
      profitabilityMonth: 0.89,
      profitabilityYear: 10.80,
      rateLabel: '94% do CDI (Isento IR)',
      dueDate: '2027-06-01',
      status: 'ACTIVE',
    },
    {
      id: 'inv-pluggy-04',
      itemId: 'item-pluggy-nubank-001',
      institutionName: 'Nubank',
      name: 'Tesouro Selic 2029 (LFT)',
      code: 'TESOURO-SELIC-2029',
      type: 'TREASURY',
      subtype: 'Tesouro Direto',
      balance: 6540.25,
      amountOriginal: 5800.00,
      profitabilityMonth: 0.95,
      profitabilityYear: 11.52,
      rateLabel: 'SELIC + 0,049%',
      dueDate: '2029-03-01',
      status: 'ACTIVE',
    },
  ];

  return computeOpenFinanceSummary('sandbox_demo', false, connections, accounts, transactions, investments);
}

export function computeOpenFinanceSummary(
  mode: 'live' | 'sandbox_demo',
  hasConfiguredCredentials: boolean,
  connections: OpenFinanceItemConnection[],
  accounts: OpenFinanceAccount[],
  transactions: OpenFinanceTransaction[],
  investments: OpenFinanceInvestment[]
): OpenFinanceDashboardData {
  const checkingAccounts = accounts.filter((a) => a.type === 'BANK' && a.subtype === 'CHECKING_ACCOUNT');
  const savingsAccounts = accounts.filter((a) => a.type === 'BANK' && a.subtype === 'SAVINGS_ACCOUNT');
  const creditAccounts = accounts.filter((a) => a.type === 'CREDIT');

  const totalCheckingBalance = checkingAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalSavingsBalance = savingsAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalInvestmentsBalance = investments.reduce((acc, i) => acc + i.balance, 0);
  const totalCreditCardInvoice = creditAccounts.reduce((acc, c) => acc + c.balance, 0);
  const totalCreditLimit = creditAccounts.reduce((acc, c) => acc + (c.creditData?.creditLimit || 0), 0);
  const totalCreditAvailable = creditAccounts.reduce((acc, c) => acc + (c.creditData?.availableCreditLimit || 0), 0);

  const netWorth = totalCheckingBalance + totalSavingsBalance + totalInvestmentsBalance - totalCreditCardInvoice;

  const monthlyPixOutflow = transactions
    .filter((t) => t.type === 'DEBIT' && (t.paymentMethod === 'PIX' || t.paymentMethod === 'BOLETO'))
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyPixInflow = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    mode,
    hasConfiguredCredentials,
    connections,
    accounts,
    transactions,
    investments,
    summary: {
      totalCheckingBalance,
      totalSavingsBalance,
      totalInvestmentsBalance,
      totalCreditCardInvoice,
      totalCreditLimit,
      totalCreditAvailable,
      netWorth,
      monthlyPixOutflow,
      monthlyPixInflow,
    },
  };
}

