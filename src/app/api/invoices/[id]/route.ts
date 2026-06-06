import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { vendor: true, purchaseOrder: { include: { quotation: { include: { rfq: { select: { title: true, rfqNumber: true } } } } } } } });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const VALID_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!VALID_STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    const invoice = await prisma.invoice.update({ where: { id }, data: { status: body.status } });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'INVOICE_STATUS_CHANGED', entityType: 'Invoice', entityId: id, details: `Invoice status → ${body.status}` } });
    return NextResponse.json({ invoice });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
