import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/api-client';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
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
    const limit = searchParams.get('limit') || '100';
    const chainId = searchParams.get('chainId') || DEFAULT_CHAIN;

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Log incoming request
    debugLog(`[${requestId}] Depth Request:`, {
      timestamp: new Date().toISOString(),
      symbol,
      limit,
    });

    // Try Paxeer CEX depth first
    try {
      const cexPair = resolveCexPairSymbol(symbol);
      const url = `https://cex.paxeer.app/api/exchange/orderbook/${encodeURIComponent(cexPair)}?limit=${encodeURIComponent(limit)}`;
      debugLog(`[${requestId}] Trying CEX depth: ${url}`);
      const res = await fetch(url, { next: { revalidate: 2 } });
      const status = res.status;
      let text = '';
      try {
        text = await res.text();
      } catch (readErr) {
        debugError(`[${requestId}] Failed reading CEX depth response body`, readErr);
      }
      debugLog(`[${requestId}] CEX depth response status: ${status}, body preview: ${text.slice(0, 200)}`);
      if (res.ok) {
        try {
          const json = JSON.parse(text);
          if (json && Array.isArray(json.bids) && Array.isArray(json.asks)) {
            const transformed = {
              lastUpdateId: Date.now(),
              bids: json.bids.map((b: [number, number]) => [String(b[0]), String(b[1])]),
              asks: json.asks.map((a: [number, number]) => [String(a[0]), String(a[1])]),
            };
            debugLog(`[${requestId}] CEX depth success for ${cexPair} with ${transformed.bids.length} bids / ${transformed.asks.length} asks`);
            return NextResponse.json(transformed);
          } else {
            debugError(`[${requestId}] CEX depth JSON missing bids/asks arrays`);
          }
        } catch (parseErr) {
          debugError(`[${requestId}] Failed to parse CEX depth JSON`, parseErr);
        }
      } else {
        debugError(`[${requestId}] CEX depth non-OK status ${status}`);
      }
    } catch (e) {
      debugError(`[${requestId}] CEX depth fetch failed, will fallback`, e);
    }

    // Fallback to the existing indexer endpoint
    const endpoint = `/api/depth?symbol=${encodeURIComponent(symbol)}`;
    
    debugLog(`[${requestId}] Using chain ID:`, chainId);
    
    debugLog(`[${requestId}] Forwarding to API endpoint:`, endpoint);
    
    const data = await apiGet(chainId, endpoint);
    const requestDuration = Date.now() - requestStartTime;

    // Log response
    debugLog(`[${requestId}] Depth Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: 200,
      symbol,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    debugError('Depth proxy error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}