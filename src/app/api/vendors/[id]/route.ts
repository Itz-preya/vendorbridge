import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { vendorSchema } from '@/lib/validations';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'BLACKLISTED'];
    if (!VALID_STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    // Atomically delete all related records in a transaction
    const vendor = await prisma.$transaction(async (tx) => {
      await tx.invoice.deleteMany({ where: { vendorId: id } });
      await tx.purchaseOrder.deleteMany({ where: { vendorId: id } });
      const quotes = await tx.quotation.findMany({ where: { vendorId: id } });
      if (quotes.length > 0) {
        await tx.approval.deleteMany({ where: { quotationId: { in: quotes.map(q => q.id) } } });
      }
      await tx.quotation.deleteMany({ where: { vendorId: id } });
      await tx.rFQVendor.deleteMany({ where: { vendorId: id } });
      return tx.vendor.delete({ where: { id } });
    });

    await prisma.activityLog.create({ data: { userId: user.userId, action: 'VENDOR_DELETED', entityType: 'Vendor', entityId: id, details: `Deleted vendor: ${vendor.company}` } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}
