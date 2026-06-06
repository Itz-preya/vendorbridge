import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VendorBridge database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQVendor.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  // ── Users ──
  const admin = await prisma.user.create({ data: { name: 'Arjun Sharma', email: 'admin@vendorbridge.com', password: await hash('password123'), role: 'ADMIN' } });
  const officer = await prisma.user.create({ data: { name: 'Priya Mehta', email: 'officer@vendorbridge.com', password: await hash('password123'), role: 'PROCUREMENT_OFFICER' } });
  const vendorUser = await prisma.user.create({ data: { name: 'Ravi Kumar', email: 'vendor@vendorbridge.com', password: await hash('password123'), role: 'VENDOR' } });
  const manager = await prisma.user.create({ data: { name: 'Sunita Patel', email: 'manager@vendorbridge.com', password: await hash('password123'), role: 'MANAGER' } });

  // ── Vendors ──
  const v1 = await prisma.vendor.create({ data: { name: 'Ravi Kumar', company: 'TechSolutions India Pvt Ltd', email: 'ravi@techsolutions.in', phone: '+91 9876543210', gstNumber: '27AABCU9603R1ZM', category: 'IT_SERVICES', status: 'ACTIVE', address: '404, Tech Park, Andheri East, Mumbai - 400069', userId: vendorUser.id } });
  const v2 = await prisma.vendor.create({ data: { name: 'Kavita Singh', company: 'ManuPro Industries Ltd', email: 'kavita@manupro.co.in', phone: '+91 9123456780', gstNumber: '09AAACM2850K1Z4', category: 'MANUFACTURING', status: 'ACTIVE', address: 'B-12, Industrial Area, Sector 63, Noida - 201301' } });
  const v3 = await prisma.vendor.create({ data: { name: 'Mohan Das', company: 'BizConsult Advisory LLP', email: 'mohan@bizconsult.in', phone: '+91 9988776655', gstNumber: '29AABFB2553R1ZR', category: 'CONSULTING', status: 'ACTIVE', address: '3rd Floor, Prestige Tower, MG Road, Bengaluru - 560001' } });
  const v4 = await prisma.vendor.create({ data: { name: 'Deepak Nair', company: 'SwiftLog Carriers Pvt Ltd', email: 'deepak@swiftlog.in', phone: '+91 9745612380', gstNumber: '32AADCS5784Q1ZL', category: 'LOGISTICS', status: 'ACTIVE', address: 'NH 66 Bypass, Edapally, Kochi - 682024' } });
  await prisma.vendor.create({ data: { name: 'Ananya Reddy', company: 'PrimeMat Suppliers', email: 'ananya@primemat.in', phone: '+91 9966554433', gstNumber: '36AABCP7421R1ZT', category: 'RAW_MATERIALS', status: 'ACTIVE', address: 'Plot 7, APIIC Industrial Park, Hyderabad - 500081' } });
  const v6 = await prisma.vendor.create({ data: { name: 'Rajesh Gupta', company: 'OfficeFirst Supplies', email: 'rajesh@officefirst.in', phone: '+91 9900112233', gstNumber: '24AAACG5678D1ZQ', category: 'OFFICE_SUPPLIES', status: 'INACTIVE', address: '15, Sardar Patel Marg, Ahmedabad - 380009' } });

  // ── RFQs ──
  const rfq1 = await prisma.rFQ.create({
    data: {
      rfqNumber: 'RFQ-2025-001',
      title: 'Enterprise Software Development Services',
      description: 'We require experienced software development services for our enterprise resource planning system upgrade.',
      items: JSON.stringify([
        { name: 'Backend Development', description: 'Node.js/Python API development', quantity: 1, unit: 'project' },
        { name: 'Frontend Development', description: 'React.js UI development', quantity: 1, unit: 'project' },
        { name: 'Database Design', description: 'PostgreSQL schema design & optimization', quantity: 1, unit: 'project' },
      ]),
      deadline: new Date('2025-07-15'),
      status: 'SENT',
      createdById: officer.id,
      rfqVendors: { create: [{ vendorId: v1.id }, { vendorId: v3.id }] },
    },
  });

  const rfq2 = await prisma.rFQ.create({
    data: {
      rfqNumber: 'RFQ-2025-002',
      title: 'Office Equipment & Supplies Procurement',
      description: 'Annual procurement of office supplies including stationery, printer consumables, and ergonomic furniture.',
      items: JSON.stringify([
        { name: 'A4 Paper Reams', description: 'JK Copier 75 GSM', quantity: 500, unit: 'reams' },
        { name: 'Printer Cartridges', description: 'HP 680 Black & Color', quantity: 100, unit: 'sets' },
        { name: 'Ergonomic Chairs', description: 'Mid-back mesh office chairs', quantity: 25, unit: 'pieces' },
      ]),
      deadline: new Date('2025-06-30'),
      status: 'SENT',
      createdById: officer.id,
      rfqVendors: { create: [{ vendorId: v6.id }, { vendorId: v2.id }] },
    },
  });

  await prisma.rFQ.create({
    data: {
      rfqNumber: 'RFQ-2025-003',
      title: 'Warehouse Logistics & Transportation Services',
      description: 'Require 3PL logistics partner for inbound/outbound warehouse operations and last-mile delivery.',
      items: JSON.stringify([
        { name: 'Warehouse Space', description: '5000 sq ft temperature-controlled storage', quantity: 1, unit: 'month' },
        { name: 'Transportation', description: 'Dedicated truck for daily deliveries', quantity: 20, unit: 'trips' },
      ]),
      deadline: new Date('2025-08-01'),
      status: 'DRAFT',
      createdById: officer.id,
      rfqVendors: { create: [{ vendorId: v4.id }] },
    },
  });

  // ── Quotations ──
  const q1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-001',
      rfqId: rfq1.id,
      vendorId: v1.id,
      items: JSON.stringify([
        { name: 'Backend Development', quantity: 1, unitPrice: 850000, totalPrice: 850000 },
        { name: 'Frontend Development', quantity: 1, unitPrice: 650000, totalPrice: 650000 },
        { name: 'Database Design', quantity: 1, unitPrice: 200000, totalPrice: 200000 },
      ]),
      totalAmount: 1700000,
      deliveryTimeline: '3 months from PO date',
      notes: 'Includes 6 months free support post-delivery. GST extra as applicable.',
      status: 'ACCEPTED',
    },
  });

  await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-002',
      rfqId: rfq1.id,
      vendorId: v3.id,
      items: JSON.stringify([
        { name: 'Backend Development', quantity: 1, unitPrice: 950000, totalPrice: 950000 },
        { name: 'Frontend Development', quantity: 1, unitPrice: 720000, totalPrice: 720000 },
        { name: 'Database Design', quantity: 1, unitPrice: 280000, totalPrice: 280000 },
      ]),
      totalAmount: 1950000,
      deliveryTimeline: '4 months from PO date',
      notes: 'Comprehensive solution with project management included.',
      status: 'REJECTED',
    },
  });

  const q3 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-003',
      rfqId: rfq2.id,
      vendorId: v6.id,
      items: JSON.stringify([
        { name: 'A4 Paper Reams', quantity: 500, unitPrice: 320, totalPrice: 160000 },
        { name: 'Printer Cartridges', quantity: 100, unitPrice: 850, totalPrice: 85000 },
        { name: 'Ergonomic Chairs', quantity: 25, unitPrice: 8500, totalPrice: 212500 },
      ]),
      totalAmount: 457500,
      deliveryTimeline: '7 working days',
      notes: 'Free delivery for orders above ₹3 lakhs. All products carry 1-year warranty.',
      status: 'SUBMITTED',
    },
  });

  // ── Approval ──
  const approval = await prisma.approval.create({
    data: {
      quotationId: q1.id,
      approverId: manager.id,
      status: 'APPROVED',
      remarks: 'Quotation reviewed and approved. TechSolutions India has excellent past performance. Proceed with PO generation.',
    },
  });

  // ── Purchase Order ──
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2025-001',
      quotationId: q1.id,
      vendorId: v1.id,
      items: JSON.stringify([
        { name: 'Backend Development', quantity: 1, unitPrice: 850000, totalPrice: 850000 },
        { name: 'Frontend Development', quantity: 1, unitPrice: 650000, totalPrice: 650000 },
        { name: 'Database Design', quantity: 1, unitPrice: 200000, totalPrice: 200000 },
      ]),
      subtotal: 1700000,
      taxRate: 18,
      taxAmount: 306000,
      totalAmount: 2006000,
      status: 'ISSUED',
    },
  });

  // ── Invoice ──
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      purchaseOrderId: po.id,
      vendorId: v1.id,
      items: JSON.stringify([
        { name: 'Backend Development', hsn: '998314', quantity: 1, unitPrice: 850000, totalPrice: 850000 },
        { name: 'Frontend Development', hsn: '998314', quantity: 1, unitPrice: 650000, totalPrice: 650000 },
        { name: 'Database Design', hsn: '998314', quantity: 1, unitPrice: 200000, totalPrice: 200000 },
      ]),
      subtotal: 1700000,
      cgst: 153000,
      sgst: 153000,
      igst: 0,
      totalTax: 306000,
      totalAmount: 2006000,
      status: 'SENT',
      dueDate: new Date('2025-07-30'),
    },
  });

  // ── Activity Logs ──
  const logs = [
    { userId: officer.id, action: 'RFQ_CREATED', entityType: 'RFQ', entityId: rfq1.id, details: `Created RFQ: ${rfq1.rfqNumber} - ${rfq1.title}` },
    { userId: officer.id, action: 'RFQ_SENT', entityType: 'RFQ', entityId: rfq1.id, details: `RFQ sent to 2 vendors` },
    { userId: vendorUser.id, action: 'QUOTATION_SUBMITTED', entityType: 'Quotation', entityId: q1.id, details: `Quotation submitted: ${q1.quotationNumber} for ₹${(q1.totalAmount/100000).toFixed(1)}L` },
    { userId: officer.id, action: 'QUOTATION_SELECTED', entityType: 'Quotation', entityId: q1.id, details: `Selected ${q1.quotationNumber} from TechSolutions India` },
    { userId: manager.id, action: 'APPROVAL_APPROVED', entityType: 'Approval', entityId: approval.id, details: `Approved quotation ${q1.quotationNumber}` },
    { userId: officer.id, action: 'PO_CREATED', entityType: 'PurchaseOrder', entityId: po.id, details: `Purchase Order ${po.poNumber} generated for ₹20.06L` },
    { userId: officer.id, action: 'INVOICE_CREATED', entityType: 'Invoice', entityId: 'inv1', details: `Invoice INV-2025-001 generated` },
    { userId: officer.id, action: 'RFQ_CREATED', entityType: 'RFQ', entityId: rfq2.id, details: `Created RFQ: ${rfq2.rfqNumber} - ${rfq2.title}` },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }

  // ── Notifications ──
  const notifications = [
    { userId: officer.id, title: 'New Quotation Received', message: 'TechSolutions India submitted quotation QTN-2025-001 for RFQ-2025-001', type: 'QUOTATION', entityId: q1.id },
    { userId: officer.id, title: 'Quotation Approved', message: 'Manager Sunita Patel approved QTN-2025-001. Generate Purchase Order now.', type: 'APPROVAL', entityId: approval.id },
    { userId: manager.id, title: 'Approval Required', message: 'Quotation QTN-2025-003 needs your review and approval.', type: 'APPROVAL', entityId: q3.id },
    { userId: vendorUser.id, title: 'RFQ Assigned', message: 'You have been invited to quote for RFQ-2025-001: Enterprise Software Development', type: 'RFQ', entityId: rfq1.id },
    { userId: admin.id, title: 'New User Registered', message: 'A new vendor user has registered on VendorBridge.', type: 'USER', entityId: vendorUser.id },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  console.log('✅ Seeding complete!');
  console.log('\n📋 Demo Accounts:');
  console.log('  admin@vendorbridge.com     | password123 | ADMIN');
  console.log('  officer@vendorbridge.com   | password123 | PROCUREMENT_OFFICER');
  console.log('  vendor@vendorbridge.com    | password123 | VENDOR');
  console.log('  manager@vendorbridge.com   | password123 | MANAGER');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
