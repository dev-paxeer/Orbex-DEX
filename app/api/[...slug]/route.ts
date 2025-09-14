import { NextRequest, NextResponse } from 'next/server';
import { getIndexerUrl } from '@/constants/urls/urls-config';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';

function getChainIdFromRequest(request: NextRequest): string {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId') || DEFAULT_CHAIN;
  return chainId.toString();
}

function buildTargetUrl(request: NextRequest, slugParts: string[] | undefined) {
  const url = new URL(request.url);
  const chainId = getChainIdFromRequest(request);
  const path = Array.isArray(slugParts) ? slugParts.join('/') : '';
  const base = `${getIndexerUrl(chainId)}/api/${path}`.replace(/\/+$/, '');
  // Forward all params except chainId
  const fwd = new URLSearchParams(url.searchParams);
  fwd.delete('chainId');
  return fwd.toString() ? `${base}?${fwd.toString()}` : base;
}

async function forward(request: NextRequest, slug: string[] | undefined) {
  const targetUrl = buildTargetUrl(request, slug);
  const method = request.method.toUpperCase();

  // For non-GET methods, forward body
  const init: RequestInit = {
    method,
    headers: {
      'Accept': '*/*',
      // Let upstream infer content type if original didn't set one
      ...(request.headers.get('content-type')
        ? { 'Content-Type': request.headers.get('content-type') as string }
        : {}),
    },
    cache: 'no-store',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    // Preserve raw body to support JSON and other content types
    const body = await request.arrayBuffer();
    init.body = body;
  }

  const resp = await fetch(targetUrl, init);
  const buf = await resp.arrayBuffer();
  const contentType = resp.headers.get('content-type') || 'application/json';

  return new NextResponse(buf, {
    status: resp.status,
    headers: {
      'Content-Type': contentType,
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest, ctx: { params: { slug?: string[] } }) {
  return forward(request, ctx.params.slug);
}

export async function POST(request: NextRequest, ctx: { params: { slug?: string[] } }) {
  return forward(request, ctx.params.slug);
}

export async function PUT(request: NextRequest, ctx: { params: { slug?: string[] } }) {
  return forward(request, ctx.params.slug);
}

export async function PATCH(request: NextRequest, ctx: { params: { slug?: string[] } }) {
  return forward(request, ctx.params.slug);
}

export async function DELETE(request: NextRequest, ctx: { params: { slug?: string[] } }) {
  return forward(request, ctx.params.slug);
}
