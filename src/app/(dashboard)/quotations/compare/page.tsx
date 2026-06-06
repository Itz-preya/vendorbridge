import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CompareClient from './CompareClient';

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ rfqId: string }> }) {
  const { rfqId } = await searchParams;
  if (!rfqId) redirect('/rfq');

  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  const quotations = await prisma.quotation.findMany({
    where: { rfqId },
    include: { vendor: true },
    orderBy: { totalAmount: 'asc' },
  });

  if (!rfq || quotations.length === 0) redirect('/rfq');

  const parsed = quotations.map(q => ({
    ...q,
    parsedItems: JSON.parse(q.items) as { name: string; quantity: number; unitPrice: number; totalPrice: number }[],
  }));

  return <CompareClient rfq={rfq} quotations={parsed} />;
}
