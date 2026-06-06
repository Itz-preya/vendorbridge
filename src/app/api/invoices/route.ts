import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: { vendor: { select: { company: true } }, purchaseOrder: { select: { poNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${uniqueSuffix}`;
    const subtotal = parseFloat(body.subtotal);
    // Same-state GST: CGST 9% + SGST 9%; inter-state: IGST 18%
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const igst = 0;
    const totalTax = cgst + sgst;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber, purchaseOrderId: body.purchaseOrderId, vendorId: body.vendorId,
        items: body.items, subtotal, cgst, sgst, igst, totalTax, totalAmount: subtotal + totalTax,
        status: 'DRAFT', dueDate,
      },
    });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'INVOICE_CREATED', entityType: 'Invoice', entityId: invoice.id, details: `Generated ${invoice.invoiceNumber}` } });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
