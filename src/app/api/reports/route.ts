import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalVendors, totalRFQs, totalPOs, totalInvoices] = await Promise.all([
      prisma.vendor.count(),
      prisma.rFQ.count(),
      prisma.purchaseOrder.count(),
      prisma.invoice.count(),
    ]);

    const totalSpendRes = await prisma.invoice.aggregate({ _sum: { totalAmount: true } });
    const totalSpend = totalSpendRes._sum.totalAmount || 0;

    // Monthly data - last 6 months
    const now = new Date();
    const months: { month: string; pos: number; invoices: number; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [pos, invRes] = await Promise.all([
        prisma.purchaseOrder.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.invoice.aggregate({ _count: true, _sum: { totalAmount: true }, where: { createdAt: { gte: start, lte: end } } }),
      ]);
      months.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), pos, invoices: invRes._count, amount: invRes._sum.totalAmount || 0 });
    }

    // Vendor performance
    const vendors = await prisma.vendor.findMany({
      include: { purchaseOrders: { select: { totalAmount: true } }, quotations: { select: { id: true } } },
    });
    const vendorPerformance = vendors.map(v => ({
      company: v.company,
      category: v.category,
      totalOrders: v.purchaseOrders.length,
      totalAmount: v.purchaseOrders.reduce((s, p) => s + p.totalAmount, 0),
      quotations: v.quotations.length,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // Category spending
    const categorySpending = Object.entries(
      vendors.reduce((acc, v) => {
        const amount = v.purchaseOrders.reduce((s, p) => s + p.totalAmount, 0);
        acc[v.category] = (acc[v.category] || 0) + amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

    return NextResponse.json({ totalVendors, totalRFQs, totalPOs, totalInvoices, totalSpend, monthlyData: months, vendorPerformance, categorySpending });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
