import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const approvals = await prisma.approval.findMany({
      include: { quotation: { include: { rfq: { select: { rfqNumber: true, title: true } }, vendor: { select: { company: true } } } }, approver: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ approvals });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const managers = await prisma.user.findMany({ where: { role: { in: ['MANAGER', 'ADMIN'] } }, take: 1 });
    if (managers.length === 0) return NextResponse.json({ error: 'No manager available' }, { status: 400 });
    const approval = await prisma.approval.create({ data: { quotationId: body.quotationId, approverId: managers[0].id, status: 'PENDING' } });
    await prisma.notification.create({ data: { userId: managers[0].id, title: 'Approval Required', message: `A quotation needs your approval`, type: 'APPROVAL', entityId: approval.id } });
    return NextResponse.json({ approval }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
