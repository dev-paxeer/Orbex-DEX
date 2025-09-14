import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { apiGet } from '@/lib/api-client';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCexPairSymbol } from '@/lib/symbol-resolver';

// Helper function for debug logging
function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

// Helper function for debug error logging
function debugError(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
}

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get the symbol from the URL
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const chainId = searchParams.get('chainId') || DEFAULT_CHAIN;

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Log incoming request
    debugLog(`[${requestId}] Ticker Price Request:`, {
      timestamp: new Date().toISOString(),
      symbol,
    });

    // Try Paxeer CEX first
    try {
      const cexPair = resolveCexPairSymbol(symbol);
      const url = `https://cex.paxeer.app/api/exchange/ticker/${encodeURIComponent(cexPair)}`;
      debugLog(`[${requestId}] Trying CEX ticker price: ${url}`);
      const res = await fetch(url, { next: { revalidate: 2 } });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.last !== undefined)) {
          // CEX response includes last, close, bid, ask
          const last = json.last ?? json.close;
          return NextResponse.json({ symbol, price: String(last) });
        }
      }
    } catch (e) {
      debugError(`[${requestId}] CEX ticker price failed, will fallback`, e);
    }

    // Fallback to the existing indexer endpoint
    const endpoint = `/api/ticker/price?symbol=${encodeURIComponent(symbol)}`;
    
    debugLog(`[${requestId}] Using chain ID:`, chainId);
    
    debugLog(`[${requestId}] Forwarding to API endpoint:`, endpoint);
    
    const data = await apiGet<{ symbol: string; price: string }>(chainId, endpoint);
    const requestDuration = Date.now() - requestStartTime;

    // Log response
    debugLog(`[${requestId}] Ticker Price Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: 200,
      symbol,
      price: data.price,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    debugError('Ticker price proxy error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}