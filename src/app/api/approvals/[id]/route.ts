import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden: Only Managers can approve' }, { status: 403 });
    const body = await req.json();

    if (!body.status || !['APPROVED', 'REJECTED'].includes(body.status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    if (body.status === 'REJECTED' && (!body.remarks || body.remarks.length < 10))
      return NextResponse.json({ error: 'Rejection reason must be at least 10 characters' }, { status: 400 });

    const approval = await prisma.approval.update({ where: { id }, data: { status: body.status, remarks: body.remarks || null }, include: { quotation: { include: { vendor: true } } } });

    await prisma.activityLog.create({ data: { userId: user.userId, action: `APPROVAL_${body.status}`, entityType: 'Approval', entityId: id, details: `${body.status} quotation ${approval.quotation.quotationNumber}` } });

    if (body.status === 'APPROVED') {
      // Auto-create Purchase Order
      const q = approval.quotation;
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const poNumber = `PO-${new Date().getFullYear()}-${uniqueSuffix}`;
      const subtotal = q.totalAmount;
      const taxAmount = subtotal * 0.18;
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber, quotationId: q.id, vendorId: q.vendorId,
          items: q.items, subtotal, taxRate: 18, taxAmount, totalAmount: subtotal + taxAmount, status: 'ISSUED',
        },
      });
      await prisma.activityLog.create({ data: { userId: user.userId, action: 'PO_CREATED', entityType: 'PurchaseOrder', entityId: po.id, details: `Auto-created ${po.poNumber} after approval` } });

      // Notify vendor
      if (approval.quotation.vendor.userId) {
        await prisma.notification.create({ data: { userId: approval.quotation.vendor.userId, title: 'Quotation Approved! PO Issued', message: `Your quotation ${q.quotationNumber} has been approved. Purchase Order ${po.poNumber} has been issued.`, type: 'PO', entityId: po.id } });
      }
    }

    return NextResponse.json({ approval });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
