import { prisma } from '@/lib/prisma';
import ApprovalClient from './ApprovalClient';

export default async function ApprovalsPage() {
  const approvals = await prisma.approval.findMany({
    include: { quotation: { include: { rfq: { select: { rfqNumber: true, title: true } }, vendor: { select: { company: true } } } }, approver: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Approval Workflow</h1>
          <p className="page-subtitle">{approvals.filter(a => a.status === 'PENDING').length} pending · {approvals.length} total</p>
        </div>
      </div>
      <ApprovalClient approvals={approvals} />
    </div>
  );
}
