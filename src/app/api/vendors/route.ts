import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { vendorSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const vendors = await prisma.vendor.findMany({
      where: {
        AND: [
          search ? { OR: [{ name: { contains: search } }, { company: { contains: search } }, { email: { contains: search } }] } : {},
          category ? { category } : {},
          status ? { status } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ vendors });
  } catch { return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_OFFICER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const result = vendorSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });

    const existing = await prisma.vendor.findFirst({ where: { OR: [{ email: result.data.email }, { gstNumber: result.data.gstNumber }] } });
    if (existing) return NextResponse.json({ error: 'Vendor with this email or GST number already exists' }, { status: 409 });

    const vendor = await prisma.vendor.create({ data: { ...result.data, status: 'ACTIVE' } });
    await prisma.activityLog.create({ data: { userId: user.userId, action: 'VENDOR_CREATED', entityType: 'Vendor', entityId: vendor.id, details: `Created vendor: ${vendor.company}` } });
    return NextResponse.json({ vendor }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 }); }
}
