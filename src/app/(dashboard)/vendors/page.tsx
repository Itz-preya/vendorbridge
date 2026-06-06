import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import VendorClient from './VendorClient';

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
  const user = await getCurrentUser();
  const role = user?.role || 'VENDOR';
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Vendor Management</h1>
          <p className="page-subtitle">{vendors.length} vendors registered</p>
        </div>
      </div>
      <VendorClient initial={vendors} userRole={role} />
    </div>
  );
}
