import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { vendor: true, quotation: { include: { rfq: { select: { rfqNumber: true, title: true } } } }, invoice: true } });
  if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ purchaseOrder: po });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const po = await prisma.purchaseOrder.update({ where: { id }, data: { status: body.status } });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'PO_STATUS_CHANGED', entityType: 'PurchaseOrder', entityId: id, details: `${po.poNumber} → ${body.status}` } });
    return NextResponse.json({ purchaseOrder: po });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
