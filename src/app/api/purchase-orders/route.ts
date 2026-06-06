import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const pos = await prisma.purchaseOrder.findMany({
      include: { vendor: { select: { company: true } }, quotation: { select: { quotationNumber: true } }, invoice: { select: { id: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ purchaseOrders: pos });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const poNumber = `PO-${new Date().getFullYear()}-${uniqueSuffix}`;
    const subtotal = parseFloat(body.subtotal);
    const taxAmount = subtotal * 0.18;
    const po = await prisma.purchaseOrder.create({
      data: { poNumber, quotationId: body.quotationId, vendorId: body.vendorId, items: body.items, subtotal, taxRate: 18, taxAmount, totalAmount: subtotal + taxAmount, status: 'ISSUED' },
    });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'PO_CREATED', entityType: 'PurchaseOrder', entityId: po.id, details: `Created ${po.poNumber}` } });
    return NextResponse.json({ purchaseOrder: po }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
