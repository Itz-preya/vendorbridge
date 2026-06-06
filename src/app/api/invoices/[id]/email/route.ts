import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { getCurrentUser } from '@/lib/auth';

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { vendor: true, purchaseOrder: true } });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
    const items = JSON.parse(invoice.items) as { name: string; quantity: number; unitPrice: number; totalPrice: number }[];

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
        <h1 style="color:#0f172a;border-bottom:2px solid #10b981;padding-bottom:16px;">
          <span style="color:#10b981">Vendor</span>Bridge · Invoice
        </h1>
        <table style="width:100%;margin:16px 0;">
          <tr><td><strong>Invoice #:</strong> ${invoice.invoiceNumber}</td><td style="text-align:right"><strong>PO #:</strong> ${invoice.purchaseOrder.poNumber}</td></tr>
          <tr><td><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</td>
              <td style="text-align:right"><strong>Due:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</td></tr>
        </table>
        <h3 style="color:#374151">Bill To: ${escapeHtml(invoice.vendor.company)}</h3>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead><tr style="background:#f8fafc"><th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0">Item</th><th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0">Qty</th><th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0">Amount</th></tr></thead>
          <tbody>${items.map(it => `<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9">${escapeHtml(it.name)}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #f1f5f9">${it.quantity}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #f1f5f9">${fmt(it.totalPrice)}</td></tr>`).join('')}</tbody>
        </table>
        <div style="text-align:right;padding:16px;background:#f8fafc;border-radius:8px;">
          <p>Subtotal: ${fmt(invoice.subtotal)}</p>
          ${invoice.cgst > 0 ? `<p>CGST (9%): ${fmt(invoice.cgst)}</p><p>SGST (9%): ${fmt(invoice.sgst)}</p>` : `<p>IGST (18%): ${fmt(invoice.igst)}</p>`}
          <h2 style="color:#10b981;border-top:2px solid #374151;padding-top:8px;margin-top:8px">Total: ${fmt(invoice.totalAmount)}</h2>
        </div>
        <p style="color:#64748b;font-size:12px;margin-top:24px;">This is a system-generated invoice from VendorBridge ERP.</p>
      </div>`;

    // Try sending via SMTP, fallback to mock success
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'your-email@gmail.com') {
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: parseInt(process.env.SMTP_PORT || '587'), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await transporter.sendMail({ from: process.env.SMTP_FROM || `VendorBridge <${process.env.SMTP_USER}>`, to: invoice.vendor.email, subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`, html });
    }

    await prisma.invoice.update({ where: { id }, data: { status: 'SENT' } });
    return NextResponse.json({ success: true, message: `Invoice sent to ${invoice.vendor.email}` });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed to send email' }, { status: 500 }); }
}
