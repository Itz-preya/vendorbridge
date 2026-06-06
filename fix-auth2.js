const fs = require('fs');
const path = require('path');

const files = [
  'vendors/route.ts', 'rfq/route.ts', 'quotations/route.ts', 'approvals/route.ts', 'purchase-orders/route.ts', 'invoices/route.ts',
  'vendors/[id]/route.ts', 'quotations/[id]/route.ts', 'purchase-orders/[id]/route.ts', 'invoices/[id]/route.ts', 'rfq/[id]/route.ts'
].map(f => path.join('e:/Desktop/Hackathon/vendorbridge/src/app/api', f));

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('export async function GET(req: NextRequest) {') || content.includes('export async function GET() {') || content.includes('export async function GET(req: NextRequest, { params }:')) {
    if (!content.includes("if (!user) return NextResponse.json({ error: 'Unauthorized' }")) {
      
      const authImport = "import { getCurrentUser } from '@/lib/auth';\r\n";
      if (!content.includes('getCurrentUser')) {
         content = content.replace(/(import .*;\r?\n)/, (match) => match + authImport);
      }
      
      content = content.replace(
        /export async function GET\(([^)]*)\) \{\r?\n\s*try \{/,
        `export async function GET($1) {\n  try {\n    const user = await getCurrentUser();\n    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`
      );
      fs.writeFileSync(f, content);
      console.log('Fixed GET auth in', f);
    }
  }
}
