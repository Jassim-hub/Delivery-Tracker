# Delivery Tracker Pro — Progressive Web App (PWA)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E.svg)](https://supabase.com/)

A cloud-architected, production-grade **Delivery Tracking Progressive Web App** featuring three distinct role-gated interfaces: **Rider**, **Customer**, and **Admin / Management**.

Engineered for the **Software Development Opportunity EOI Competition (UGX 5,000,000/-)** and built to strict $0 budget constraints using free-tier cloud primitives.

---

## 🌟 Key Features by Interface

### 🏍️ 1. Rider Interface (`/rider/*`)
- **Online/Offline Availability Toggle**: Real-time dispatch availability control.
- **Dispatch Queue**: Review direct assignments and claim available open queue deliveries.
- **Accept / Decline**: Instant status progression with status history logging.
- **Handover Acknowledgement**: Explicit proof-of-pickup verification with package inspection notes and simulated photo capture.
- **Active Delivery Tracking**: Live interactive map with rider pin, turn-by-turn Google Maps deep link navigation, and click-to-call direct customer & dispatch buttons.
- **Status Stepper Progression**: `Picked Up` → `In Transit` → `Delivered`.
- **On-Behalf Recipient Confirmation**: HTML5 digital signature canvas for deliveries where the customer lacks the mobile app.
- **Cost-Controlled GPS Broadcast**: Smart client throttling (writes only every $\ge 12\text{s}$ or $\ge 25\text{m}$ displacement).
- **Rider Rating Dashboard**: View average star score, tag badges, and customer feedback.

### 📦 2. Customer Interface (`/customer/*`)
- **Real-Time Live Map Tracking**: Watch your delivery approach with live rider telemetry and dynamic ETA countdowns.
- **Visual Status Stepper**: Track progress across Placed → Assigned → Picked Up → In Transit → Delivered.
- **One-Tap "Received" Button**: Instant receipt confirmation once the package arrives.
- **Click-to-Call Rider**: Direct phone contact.
- **Live Encrypted Chat**: Delivery-scoped real-time messaging with the assigned rider.
- **Automated Rating Prompt**: 1–5 star rating modal with quick-tag chips ("On time", "Friendly", "Careful handling") and confetti celebration.
- **Complete Order History**: Historical records with external SAP ByD document references.

### 🛡️ 3. Admin / Management Dashboard (`/admin/*`)
- **Live Fleet Ops Map**: Real-time visualization of all online couriers and active transit corridors in Kampala.
- **Deliveries Management**: Table and Kanban views with status filtering, multi-field search, and manual dispatcher assignment.
- **Dispatcher Override Controls**: Reassign riders, cancel orders, and record manual exceptions into `audit_log`.
- **Rider Fleet Management**: Couriers directory with online toggles, average ratings, vehicle models, and license plates.
- **SAP Business ByDesign Sync Panel**: Ingest outbound logistics delivery notes, inspect raw OData JSON payloads, and trigger manual syncs.
- **Operational Analytics (Recharts)**: Daily throughput, delivery latency trends, on-time SLA metrics, and customer rating distribution.
- **TV Display & Ops Wallboard (`/admin/tv-display`)**: Dedicated high-contrast, large-format unattended mode designed for warehouse wall screens with auto-refreshing clocks and radar telemetry.

---

## 🏗️ Architecture & Tech Stack

```
Frontend:  React 18 + Vite + TypeScript + Tailwind CSS (Flyer Palette)
Backend:   Supabase (PostgreSQL 15 + RLS + Realtime + Storage + Edge Functions)
Maps:      Google Maps Platform + Canvas/SVG Interactive Fallback
ERP:       SAP Business ByDesign (Swappable Adapter Pattern)
PWA:       vite-plugin-pwa (Workbox Cache-First & Offline Fallback)
Testing:   Vitest + React Testing Library + Playwright
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js $\ge 18.0$ and `npm`

### 1. Installation
```bash
git clone https://github.com/your-org/delivery-tracker.git
cd delivery-tracker
npm install
```

### 2. Configure Environment
Copy the `.env.example` file:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

> [!TIP]
> **Instant Demo Mode**: The application runs with high-fidelity mock data and reactive local storage out-of-the-box (`VITE_USE_MOCK_BACKEND=true`). Use the floating **Role Switcher** widget at the bottom-right corner to toggle between Admin, Riders, and Customers.

---

## 🧪 Running Tests

```bash
# Run unit & component tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📁 Repository Structure

```
delivery-tracker/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── admin/         # Admin dashboard, deliveries, riders, SAP sync, TV display
│   │   │   ├── customer/      # Customer live tracking, history, chat
│   │   │   ├── rider/         # Rider queue, active delivery, handover, signature
│   │   │   ├── auth/          # Login and signup pages
│   │   │   └── shared/        # Navbar shell
│   │   └── App.tsx            # Protected role routes
│   ├── components/
│   │   ├── chat/              # Live real-time chat window
│   │   ├── deliveries/        # Visual status stepper
│   │   ├── map/               # Live tracking map & GPS visualizer
│   │   ├── onboarding/        # Role onboarding carousel
│   │   ├── pwa/               # PWA install prompt
│   │   ├── rating/            # Rating prompt modal & confetti
│   │   └── ui/                # UI primitives (button, card, dialog, badge, input, tabs)
│   ├── features/
│   │   ├── auth/              # AuthContext, ProtectedRoute, RoleSwitcher
│   │   └── sap-byd/           # SAP ByD Adapter (Mock + Real OData Client + Fixtures)
│   ├── lib/
│   │   ├── maps/              # Geo-distance & throttling calculations
│   │   ├── push/              # Web push manager
│   │   └── supabase/          # Live Supabase client + reactive mock store
│   ├── styles/                # globals.css & Tailwind tokens
│   └── types/                 # Database and UI TypeScript definitions
├── supabase/
│   ├── migrations/            # 14 tables, RLS policies, triggers, and functions
│   ├── seed.sql               # Demo accounts, orders, and chats
│   └── functions/             # Deno Edge Functions (sap-byd-sync, send-push)
├── tests/
│   ├── unit/                  # Geo-utils & SAP ByD adapter unit tests
│   └── component/             # StatusStepper & RatingModal component tests
├── docs/
│   ├── architecture.md        # Mermaid system architecture diagrams
│   ├── erd.md                 # Mermaid entity relationship diagram
│   └── concept-note-outline.md # Complete EOI competition concept note proposal
└── vercel.json                # Security headers and SPA rewrites
```

---

## 🔒 Security & Row-Level Security (RLS)

- Strict RLS enabled on all 14 database tables (`supabase/migrations/20260820000002_rls_policies.sql`).
- Public self-service signup restricted to `rider` and `customer` roles (`admin` accounts seeded only).
- All chat and user inputs sanitized against XSS.
- Content Security Policy (CSP) and security headers configured in `vercel.json`.

---

## 📄 Deliverables & Concept Note
For detailed architectural documentation and the formal EOI competition concept note submission, see:
- [Concept Note Outline](docs/concept-note-outline.md)
- [System Architecture](docs/architecture.md)
- [Entity Relationship Diagram](docs/erd.md)
