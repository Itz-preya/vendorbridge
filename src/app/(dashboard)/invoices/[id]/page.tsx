import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import InvoiceTemplate from './InvoiceTemplate';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { vendor: true, purchaseOrder: { include: { quotation: { include: { rfq: { select: { rfqNumber: true, title: true } } } } } } },
  });
  if (!invoice) notFound();
  const parsedItems = JSON.parse(invoice.items);
  return (
    <InvoiceTemplate invoice={{
      ...invoice,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      parsedItems,
    }} />
  );
}
