import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { rfqSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const rfqs = await prisma.rFQ.findMany({
      where: status ? { status } : {},
      include: { createdBy: { select: { name: true } }, rfqVendors: { include: { vendor: { select: { id: true, company: true } } } }, quotations: { select: { id: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ rfqs });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const result = rfqSchema.safeParse({ ...body, items: typeof body.items === 'string' ? JSON.parse(body.items) : body.items });
    if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });

    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${uniqueSuffix}`;

    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        title: result.data.title,
        description: result.data.description,
        items: JSON.stringify(result.data.items),
        deadline: new Date(result.data.deadline),
        status: 'SENT',
        createdById: user.userId,
        rfqVendors: { create: result.data.vendorIds.map(id => ({ vendorId: id })) },
      },
    });

    await prisma.activityLog.create({ data: { userId: user.userId, action: 'RFQ_CREATED', entityType: 'RFQ', entityId: rfq.id, details: `Created ${rfq.rfqNumber}: ${rfq.title}` } });

    // Notify vendors
    for (const vendorId of result.data.vendorIds) {
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (vendor?.userId) {
        await prisma.notification.create({ data: { userId: vendor.userId, title: 'New RFQ Invitation', message: `You have been invited to quote for ${rfq.rfqNumber}: ${rfq.title}`, type: 'RFQ', entityId: rfq.id } });
      }
    }

    return NextResponse.json({ rfq }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 }); }
}
