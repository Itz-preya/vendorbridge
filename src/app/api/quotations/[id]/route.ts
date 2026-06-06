import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.quotation.findUnique({ where: { id }, include: { rfq: true, vendor: true, approvals: { include: { approver: { select: { name: true } } } } } });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ quotation: q });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();

    const quotation = await prisma.quotation.update({ where: { id }, data: { status: body.status } });

    if (body.status === 'ACCEPTED') {
      // Reject others for same RFQ
      await prisma.quotation.updateMany({ where: { rfqId: quotation.rfqId, id: { not: id }, status: { not: 'REJECTED' } }, data: { status: 'REJECTED' } });

      // Create approval request
      const managers = await prisma.user.findMany({ where: { role: { in: ['MANAGER', 'ADMIN'] } } });
      for (const mgr of managers.slice(0, 1)) {
        const approval = await prisma.approval.create({ data: { quotationId: id, approverId: mgr.id, status: 'PENDING' } });
        await prisma.notification.create({ data: { userId: mgr.id, title: 'Approval Required', message: `Quotation ${quotation.quotationNumber} needs your approval`, type: 'APPROVAL', entityId: approval.id } });
      }
      await prisma.rFQ.update({ where: { id: quotation.rfqId }, data: { status: 'CLOSED' } });
    }

    await prisma.activityLog.create({ data: { userId: user.userId, action: 'QUOTATION_STATUS_CHANGED', entityType: 'Quotation', entityId: id, details: `${quotation.quotationNumber} → ${body.status}` } });
    return NextResponse.json({ quotation });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
