import { NextRequest, NextResponse } from 'next/server';
import { getIndexerUrl } from '@/constants/urls/urls-config';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';

function getChainIdFromRequest(request: NextRequest): string {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || DEFAULT_CHAIN;
  return chainId.toString();
}

export async function POST(request: NextRequest) {
  try {
    const chainId = getChainIdFromRequest(request);
    const target = `${getIndexerUrl(chainId)}/graphql`;

    // Forward the JSON body as-is
    const bodyText = await request.text();

    const resp = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: bodyText,
      // Always bypass edge caches for dynamic GraphQL queries
      cache: 'no-store',
    });

    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const message = error?.message || 'GraphQL proxy error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const chainId = url.searchParams.get('chainId') || DEFAULT_CHAIN;

    // Build target URL and forward all params except chainId
    const targetBase = `${getIndexerUrl(chainId)}/graphql`;
    const fwdParams = new URLSearchParams(url.searchParams);
    fwdParams.delete('chainId');
    const targetUrl = fwdParams.toString() ? `${targetBase}?${fwdParams.toString()}` : targetBase;

    const resp = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
      cache: 'no-store',
    });

    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const message = error?.message || 'GraphQL proxy error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
