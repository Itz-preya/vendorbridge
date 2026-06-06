# VendorBridge ERP

![VendorBridge Banner](https://via.placeholder.com/1200x300/0a0e1a/10b981?text=VendorBridge+ERP+-+Procurement+%26+Vendor+Management)

VendorBridge is a modern, full-stack Enterprise Resource Planning (ERP) platform built specifically to streamline organizational procurement, vendor management, and billing workflows. 

Designed with a premium glassmorphism interface and robust role-based access control, VendorBridge digitizes the entire lifecycle from RFQ creation to invoice payment.

## 🌟 Key Features

* **Role-Based Access Control (RBAC):** Distinct interfaces and permissions for Admins, Procurement Officers, Managers, and Vendors.
* **Vendor Directory:** Track vendor details, performance, and GST compliance in a central database.
* **Request for Quotation (RFQ):** Create detailed RFQs and securely broadcast them to selected vendors.
* **Quotation Management:** Vendors can submit bids, and officers can compare them side-by-side with an auto-highlighted "Best Price" recommendation.
* **Automated Purchase Orders (POs):** Upon manager approval of a quotation, a detailed PO is instantly generated with tax calculations.
* **Invoicing & Billing:** Export invoices as PDFs, track payment statuses (Draft, Sent, Paid, Overdue), and integrate automated email delivery.
* **Interactive Analytics:** Real-time dashboards visualizing KPIs, monthly spending trends, and vendor performance via Recharts.
* **Activity Audit Log:** Comprehensive system-wide tracking of all critical actions for transparency and compliance.

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Database:** [SQLite](https://www.sqlite.org/) (Local, zero-config)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Authentication:** Custom JWT-based auth using `jose` and `bcryptjs`
* **Validation:** `zod` schema validation
* **Data Visualization:** `recharts`
* **PDF Generation:** `jspdf` and `html2canvas`
* **Email Integration:** `nodemailer`

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Itz-preya/vendorbridge.git
cd vendorbridge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of your project and configure the following variables:
```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# Authentication Secret
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: SMTP Configuration for Emailing Invoices
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="VendorBridge ERP <your-email@gmail.com>"
```

### 4. Database Setup & Seeding
Initialize the SQLite database and populate it with sample demo data (Users, RFQs, Orders):
```bash
# Push the schema to the database
npx prisma db push

# Run the seed script to populate demo data
npx prisma db seed
```

### 5. Run the Application
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Demo Accounts

If you seeded the database in Step 4, you can log in immediately with these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@vendorbridge.com` | `password123` |
| **Procurement Officer** | `officer@vendorbridge.com` | `password123` |
| **Vendor** | `vendor@vendorbridge.com` | `password123` |
| **Manager** | `manager@vendorbridge.com` | `password123` |

## 🏗️ Procurement Workflow Guide

To fully test the application, try running through the standard workflow:
1. **Login as Procurement Officer:** Create an RFQ and assign it to vendors.
2. **Login as Vendor:** View the RFQ and submit a Quotation.
3. **Login as Officer:** Review Quotations, compare them, and click "Accept" on the best one.
4. **Login as Manager:** Go to Approvals and Approve the accepted Quotation.
5. **Login as Officer:** View the auto-generated Purchase Order.
6. **Login as Vendor:** View the Purchase Order and generate/send the Invoice.

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
