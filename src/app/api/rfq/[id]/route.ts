import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        rfqVendors: { include: { vendor: true } },
        quotations: { include: { vendor: { select: { company: true } } } },
      },
    });
    if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ rfq });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const rfq = await prisma.rFQ.update({ where: { id }, data: { status: body.status } });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'RFQ_STATUS_CHANGED', entityType: 'RFQ', entityId: id, details: `${rfq.rfqNumber} status → ${body.status}` } });
    return NextResponse.json({ rfq });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.rFQ.update({ where: { id }, data: { status: 'CANCELLED' } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
