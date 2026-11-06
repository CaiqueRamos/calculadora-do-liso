import { NextRequest, NextResponse } from 'next/server';
import { createPluggyServerClient, getPluggyCredentials } from '@/lib/pluggyClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { itemId, clientUserId, clientId, clientSecret } = body;

    const creds = getPluggyCredentials(clientId, clientSecret);
    if (!creds.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          code: 'MISSING_CREDENTIALS',
          error:
            'Credenciais da Pluggy (PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET) não encontradas. Configure no arquivo .env.local ou informe suas chaves na tela de configuração.',
        },
        { status: 400 }
      );
    }

    const client = createPluggyServerClient(creds.clientId, creds.clientSecret);
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível inicializar o cliente Pluggy.' },
        { status: 500 }
      );
    }

    const tokenData = await client.createConnectToken(itemId || undefined, {
      clientUserId: clientUserId || 'faturaflow-user-01',
    });

    return NextResponse.json({
      success: true,
      accessToken: tokenData.accessToken,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao criar Connect Token na Pluggy';
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}

