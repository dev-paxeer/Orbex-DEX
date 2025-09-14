import { NextRequest, NextResponse } from 'next/server';
import { getSwapsByWallet } from '@/server/db/sqlite';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get('wallet') || '').toLowerCase();
    const limit = Number(searchParams.get('limit') || 100);
    if (!wallet) return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
    const swaps = getSwapsByWallet(wallet, limit);
    return NextResponse.json({ items: swaps });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch swaps' }, { status: 500 });
  }
}
