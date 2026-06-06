# ⬡ VendorBridge — Procurement & Vendor Management ERP

> A full-stack, role-based Procurement & Vendor Management ERP built for the Hackathon. Digitizes and streamlines end-to-end procurement workflows — from RFQ creation to invoice delivery.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Demo Credentials](#demo-credentials)
- [Procurement Workflow](#procurement-workflow)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Security](#security)
- [Deployment](#deployment)

---

## 🌟 Overview

VendorBridge simplifies and digitizes procurement operations for organizations through a centralized ERP platform. It manages the complete procurement lifecycle:

**Vendor Registration → RFQ Creation → Quotation Submission → Comparison → Approval → Purchase Order → Invoice → Email Delivery**

---

## ✨ Features

### 🔐 Authentication & Authorization
- Email & password login with JWT-based session management
- Role-based access control (RBAC) across all routes
- Secure `httpOnly` cookie sessions (24-hour expiry)
- Middleware-level route protection for all dashboard pages

### 📊 Dashboard
- Real-time KPI cards: Active Vendors, Active RFQs, Pending Approvals, Purchase Orders, Invoices, Total Spend
- Recent RFQs and Purchase Orders at a glance
- Live activity feed / audit timeline
- Quick action buttons (New RFQ, Add Vendor)

### 🏢 Vendor Management
- Register vendors with full GST details, categories, contacts, and addresses
- Vendor status tracking: **Active / Inactive / Blacklisted**
- Search and filter by name, company, category, or status
- Duplicate email/GST detection on registration
- Full vendor profile with quotation and PO history

### 📋 RFQ (Request for Quotation)
- Create RFQs with title, description, multi-line item specifications (name, description, quantity, unit)
- Set procurement deadline
- Assign specific vendors to receive the RFQ
- Status workflow: **Draft → Sent → Closed / Cancelled**
- View all quotations received against an RFQ

### 💰 Quotation Management
- Vendors submit itemized pricing against open RFQs
- Set unit prices per line item with auto-calculated totals
- Delivery timeline and notes/comments
- Status tracking: **Submitted → Under Review → Accepted / Rejected**
- Edit submitted quotations before acceptance

### 🔍 Quotation Comparison
- Side-by-side comparison of all quotations for an RFQ
- **Lowest price highlighting** with "Best Price" badge
- Delivery timeline comparison
- Direct "Accept" action from the comparison view

### ✅ Approval Workflow
- Structured approve/reject workflow for accepted quotations
- Mandatory remarks on rejection
- Approval timeline with timestamps
- Instant notifications to relevant users on status changes

### 📦 Purchase Orders
- Auto-generated unique PO numbers (e.g., `PO-2025-A7B2`)
- Tax calculations with configurable tax rate
- Subtotal, Tax Amount, and Grand Total computation
- Status lifecycle: **Draft → Issued → Acknowledged → Completed / Cancelled**
- Direct link from approved quotation to PO

### 🧾 Invoice Management
- Auto-generated invoice numbers from Purchase Orders
- Indian GST tax breakdown: CGST, SGST, IGST
- Due date setting
- Status tracking: **Draft → Sent → Paid / Overdue / Cancelled**
- **Download as PDF** (client-side via jsPDF + html2canvas)
- **Print invoice** with print-optimized CSS
- **Send invoice via email** (via Nodemailer SMTP)
- Mark invoice as Paid with one click

### 📜 Activity Logs
- Complete audit trail of all procurement actions
- Filterable by action type, entity, or user
- Timeline visualization with color-coded entries

### 🔔 Notifications
- In-system notifications for approvals, quotation submissions, invoice updates
- Real-time notification badge in sidebar

### 📈 Reports & Analytics
- Vendor performance analytics
- Procurement statistics and spending summaries
- Monthly procurement trend charts (via Recharts)
- Category-wise spending breakdown
- Exportable data views

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2 (App Router) |
| **Language** | TypeScript |
| **Database** | SQLite via Prisma ORM |
| **Auth** | JWT (`jose`) + `httpOnly` cookies |
| **Validation** | Zod |
| **Styling** | Vanilla CSS (custom design system, dark mode) |
| **Charts** | Recharts |
| **PDF** | jsPDF + html2canvas |
| **Email** | Nodemailer (SMTP) |
| **Password Hashing** | bcryptjs |
| **Runtime** | Node.js 22 |

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full access — manage users, vendors, view all analytics, all procurement actions |
| **Procurement Officer** | Create RFQs, compare quotations, generate POs and invoices |
| **Vendor** | Submit quotations, track RFQ status, view their own POs and invoices |
| **Manager** | Approve or reject procurement requests, monitor workflows |

---

## 📁 Project Structure

```
vendorbridge/
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite)
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # All protected dashboard pages
│   │   │   ├── activity/      # Activity logs page
│   │   │   ├── approvals/     # Approval workflow
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── invoices/      # Invoice list + detail + template
│   │   │   ├── purchase-orders/ # PO list + detail
│   │   │   ├── quotations/    # Quotations list, submit, compare
│   │   │   ├── reports/       # Analytics & reports
│   │   │   ├── rfq/           # RFQ list, new, detail
│   │   │   ├── vendors/       # Vendor management
│   │   │   └── layout.tsx     # Dashboard shell with Sidebar
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # login, logout, signup, me
│   │   │   ├── vendors/       # CRUD + status management
│   │   │   ├── rfq/           # CRUD + vendor assignment
│   │   │   ├── quotations/    # Submit, compare, status
│   │   │   ├── approvals/     # Approve/reject workflow
│   │   │   ├── purchase-orders/ # PO generation + status
│   │   │   ├── invoices/      # Invoice + email endpoint
│   │   │   └── reports/       # Analytics aggregation
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── globals.css        # Full design system (CSS variables, components)
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   └── Sidebar.tsx        # Navigation sidebar
│   ├── lib/
│   │   ├── auth.ts            # JWT sign/verify/getCurrentUser
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── validations.ts     # Zod schemas
│   └── middleware.ts          # Route protection + JWT injection
├── .env                       # Environment variables
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or later
- **npm** v9 or later

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vendorbridge.git
cd vendorbridge

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# 4. Initialize the database
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed with demo data
npx prisma db seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# JWT Secret — CHANGE THIS in production!
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Email Configuration (for invoice email sending)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="VendorBridge <your-email@gmail.com>"
```

> ⚠️ **Never commit your `.env` file to version control.** A strong, randomly-generated `JWT_SECRET` is required — the app will crash on startup if it's missing.

---

## 🗄️ Database Setup

VendorBridge uses **SQLite** via Prisma for zero-config local development.

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates dev.db)
npx prisma migrate dev --name init

# Seed demo data (users, vendors, RFQs, quotations, POs, invoices)
npx prisma db seed

# View database in Prisma Studio (optional)
npx prisma studio
```

### Database Models

| Model | Description |
|-------|-------------|
| `User` | Authentication & role management |
| `Vendor` | Vendor profiles with GST & category |
| `RFQ` | Request for Quotation with items JSON |
| `RFQVendor` | Many-to-many RFQ ↔ Vendor assignments |
| `Quotation` | Vendor price submissions |
| `Approval` | Approval decisions with remarks |
| `PurchaseOrder` | Generated POs with tax breakdown |
| `Invoice` | GST invoices with CGST/SGST/IGST |
| `ActivityLog` | Full audit trail |
| `Notification` | In-system user notifications |

---

## 🔑 Demo Credentials

After running the database seed (`npx prisma db seed`):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@vendorbridge.com | password123 |
| **Procurement Officer** | officer@vendorbridge.com | password123 |
| **Vendor** | vendor@vendorbridge.com | password123 |
| **Manager** | manager@vendorbridge.com | password123 |

---

## 🔄 Procurement Workflow

```
1. Procurement Officer creates an RFQ
        ↓
2. Vendors are assigned and notified
        ↓
3. Vendors submit itemized quotations
        ↓
4. Procurement team compares quotations side-by-side
        ↓
5. Best quotation is accepted → triggers approval workflow
        ↓
6. Manager approves (or rejects with remarks)
        ↓
7. Approved quotation → Purchase Order is generated
        ↓
8. PO acknowledged by Vendor
        ↓
9. Invoice is generated from the PO
        ↓
10. Invoice is printed / downloaded as PDF / emailed to vendor
        ↓
11. Invoice marked as Paid → Activity log updated
```

---

## 🌐 API Reference

All API routes are under `/api/`. Authentication is required (JWT cookie) for all endpoints except auth routes.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/signup` | Register new account |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get current user info |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors` | List vendors (with search/filter) |
| `POST` | `/api/vendors` | Create vendor |
| `GET` | `/api/vendors/:id` | Get vendor details |
| `PUT` | `/api/vendors/:id` | Update vendor |
| `PATCH` | `/api/vendors/:id` | Update vendor status |
| `DELETE` | `/api/vendors/:id` | Delete vendor (atomic transaction) |

### RFQs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rfq` | List RFQs |
| `POST` | `/api/rfq` | Create RFQ with vendor assignments |
| `GET` | `/api/rfq/:id` | Get RFQ with quotations |
| `PATCH` | `/api/rfq/:id` | Update RFQ status |
| `DELETE` | `/api/rfq/:id` | Delete RFQ |

### Quotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quotations` | List quotations (filterable by RFQ, vendor, status) |
| `POST` | `/api/quotations` | Submit quotation |
| `GET` | `/api/quotations/:id` | Get quotation details |
| `PATCH` | `/api/quotations/:id` | Update quotation status |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/approvals` | List approvals |
| `POST` | `/api/approvals` | Create approval request |
| `PATCH` | `/api/approvals/:id` | Approve or reject |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/purchase-orders` | List purchase orders |
| `POST` | `/api/purchase-orders` | Generate PO from approved quotation |
| `GET` | `/api/purchase-orders/:id` | Get PO details |
| `PATCH` | `/api/purchase-orders/:id` | Update PO status |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/invoices` | List invoices |
| `POST` | `/api/invoices` | Generate invoice from PO |
| `GET` | `/api/invoices/:id` | Get invoice details |
| `PATCH` | `/api/invoices/:id` | Update invoice status |
| `POST` | `/api/invoices/:id/email` | Send invoice via email |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | Get procurement analytics data |

---

## 🔒 Security

- **JWT Authentication**: All sessions use signed JWTs with HS256, stored in `httpOnly` cookies (not accessible from JavaScript).
- **Route Protection**: Next.js Middleware validates JWTs on every request before they reach page or API handlers.
- **Role-Based Access Control**: All API endpoints enforce role checks. Unauthorized access returns `403 Forbidden`.
- **Input Validation**: All POST/PUT/PATCH endpoints validate payloads using **Zod schemas** before any database writes.
- **Enum Validation**: PATCH status endpoints validate against whitelisted enum values to prevent database corruption.
- **XSS Prevention**: All user-supplied content rendered in HTML email templates is HTML-escaped.
- **Atomic Transactions**: Cascading deletions (e.g., deleting a vendor) use `prisma.$transaction` to prevent orphaned records.
- **Password Hashing**: All passwords are hashed with `bcryptjs` (salt rounds: 10). Plaintext passwords are never stored.
- **No Role Escalation**: Server-side signup rejects attempts to self-register as `ADMIN` or `PROCUREMENT_OFFICER`.

---

## 🏗️ Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Checklist for Production

- [ ] Set a strong, unique `JWT_SECRET` (minimum 32 characters)
- [ ] Configure `EMAIL_*` variables with production SMTP credentials
- [ ] Set `DATABASE_URL` to your production database path
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`)
- [ ] Ensure `NODE_ENV=production` is set

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

> **Note**: Vercel does not support SQLite for production deployments. For production, migrate `DATABASE_URL` to a managed database like **PlanetScale** (MySQL) or **Neon** (PostgreSQL) and update `schema.prisma` to use the appropriate provider.

---

## 📄 License

MIT License — built for the VendorBridge Hackathon 2025.

---

## 👨‍💻 Built With

- [Next.js](https://nextjs.org/) — React framework
- [Prisma](https://www.prisma.io/) — ORM & database toolkit
- [jose](https://github.com/panva/jose) — JWT library
- [Zod](https://zod.dev/) — TypeScript-first schema validation
- [Recharts](https://recharts.org/) — Composable charting library
- [jsPDF](https://github.com/parallax/jsPDF) — Client-side PDF generation
- [Nodemailer](https://nodemailer.com/) — Email sending
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Password hashing
