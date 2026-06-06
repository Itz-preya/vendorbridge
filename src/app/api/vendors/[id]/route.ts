import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { vendorSchema } from '@/lib/validations';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({ where: { id }, include: { quotations: { include: { rfq: true } }, purchaseOrders: true } });
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    return NextResponse.json({ vendor });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const result = vendorSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
    const vendor = await prisma.vendor.update({ where: { id }, data: result.data });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'VENDOR_UPDATED', entityType: 'Vendor', entityId: id, details: `Updated vendor: ${vendor.company}` } });
    return NextResponse.json({ vendor });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const vendor = await prisma.vendor.update({ where: { id }, data: { status: body.status } });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'VENDOR_STATUS_CHANGED', entityType: 'Vendor', entityId: id, details: `Vendor ${vendor.company} status → ${body.status}` } });
    return NextResponse.json({ vendor });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const vendor = await prisma.vendor.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'VENDOR_DELETED', entityType: 'Vendor', entityId: id, details: `Deleted vendor: ${vendor.company}` } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
