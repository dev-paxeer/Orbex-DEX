import { NextRequest, NextResponse } from 'next/server';
import { insertSwap, type UserSwap } from '@/server/db/sqlite';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tx_hash,
      wallet,
      traded_pair,
      amount_quote,
      amount_base,
      usd_value,
      timestamp,
    } = body || {};

    if (!tx_hash || !wallet || !traded_pair) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const swap: UserSwap = {
      tx_hash: String(tx_hash),
      wallet: String(wallet).toLowerCase(),
      traded_pair: String(traded_pair),
      amount_quote: Number(amount_quote || 0),
      amount_base: Number(amount_base || 0),
      usd_value: Number(usd_value || 0),
      timestamp: Number(timestamp || Date.now()),
    };

    insertSwap(swap);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to log swap' }, { status: 500 });
  }
}
