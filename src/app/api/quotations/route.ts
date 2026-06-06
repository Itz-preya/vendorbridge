import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rfqId = searchParams.get('rfqId') || '';
    const vendorId = searchParams.get('vendorId') || '';
    const status = searchParams.get('status') || '';
    const quotations = await prisma.quotation.findMany({
      where: { AND: [rfqId ? { rfqId } : {}, vendorId ? { vendorId } : {}, status ? { status } : {}] },
      include: { rfq: { select: { rfqNumber: true, title: true } }, vendor: { select: { company: true, email: true } }, approvals: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ quotations });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!body.rfqId || !body.vendorId || !body.items || !body.totalAmount || !body.deliveryTimeline)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const count = await prisma.quotation.count();
    const quotationNumber = `QTN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        rfqId: body.rfqId,
        vendorId: body.vendorId,
        items: JSON.stringify(body.items),
        totalAmount: parseFloat(body.totalAmount),
        deliveryTimeline: body.deliveryTimeline,
        notes: body.notes || null,
        status: 'SUBMITTED',
      },
    });

    await prisma.activityLog.create({ data: { userId: user.userId, action: 'QUOTATION_SUBMITTED', entityType: 'Quotation', entityId: quotation.id, details: `Submitted ${quotation.quotationNumber} for ₹${body.totalAmount}` } });

    // Notify procurement officer
    const officers = await prisma.user.findMany({ where: { role: 'PROCUREMENT_OFFICER' } });
    for (const officer of officers) {
      await prisma.notification.create({ data: { userId: officer.id, title: 'New Quotation Received', message: `${quotation.quotationNumber} submitted for RFQ ${body.rfqId}`, type: 'QUOTATION', entityId: quotation.id } });
    }

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
