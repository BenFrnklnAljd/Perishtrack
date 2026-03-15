# 🥐 BreadTrack
**Inventory & Sales Management App for Perishable Goods**

A mobile-first Vue 3 application for bakeries, cafés, and food stalls to track daily production, sales, inventory balance, expiration, and profit/loss analytics — all stored locally with no backend required.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher → https://nodejs.org
- **npm** v8 or higher (comes with Node.js)

### Installation

```bash
# 1. Navigate into the project folder
cd perishtrack

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Then open your browser at **http://localhost:5173**

### Build for Production (Vercel / static hosting)

```bash
npm run build
```

The output will be in the `dist/` folder. Deploy that folder to Vercel, Netlify, or any static host.

---

## 🔐 Default Login

| Username | Password |
|----------|----------|
| admin    | 1234     |

You can create additional staff accounts from the login screen.

---

## 📁 Project Structure

```
perishtrack/
├── index.html                    # App entry HTML
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies
│
└── src/
    ├── main.js                   # App bootstrap (Vue + Pinia + Router)
    ├── App.vue                   # Root component (toast container)
    │
    ├── assets/
    │   └── main.css              # Global styles & CSS variables
    │
    ├── router/
    │   └── index.js              # Vue Router (all routes + auth guard)
    │
    ├── stores/
    │   ├── auth.js               # Authentication (login/register/session)
    │   ├── inventory.js          # Core data store (products/production/sales)
    │   └── toast.js              # Global toast notification store
    │
    ├── composables/
    │   └── usePdf.js             # PDF export logic (jsPDF)
    │
    ├── utils/
    │   ├── storage.js            # LocalStorage helpers + uid generator
    │   └── date.js               # Date utilities + expiry logic
    │
    ├── components/
    │   ├── layout/
    │   │   └── AppShell.vue      # Main layout: TopBar + BottomNav + Router
    │   └── ui/
    │       ├── BaseModal.vue     # Reusable bottom-sheet modal
    │       └── StatCard.vue      # Dashboard stat tile component
    │
    └── views/                    # One file per tab/route
        ├── LoginView.vue         # Login & staff registration
        ├── DashboardView.vue     # Today's summary + stock overview
        ├── ParticularsView.vue   # Product management (CRUD)
        ├── ProduceView.vue       # Production batch logging
        ├── SalesView.vue         # Sales recording + receipt
        ├── InventoryView.vue     # Balance table + product detail
        └── ReportsView.vue       # Analytics + PDF export
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Staff Login | Local credential storage, session persistence |
| 🏷️ Products | Add/edit food & beverage items with pricing |
| 🏭 Production Log | Log daily batches with date & notes |
| 🛒 Sales | Record sales, auto-calculate balance |
| 📦 Inventory | Real-time balance: `Produced − Sold − Expired` |
| ⚠️ Expiry Alerts | Auto-detect batches older than 2 days |
| 📉 Loss Tracking | Expired units counted as total loss |
| 📊 Reports | Daily / Weekly / Monthly with product filter |
| 📄 PDF Export | Full report + thermal receipt download |
| 📱 Mobile-first | Optimized for phones, offline-capable |

---

## 🧠 Core Inventory Logic

```
Current Balance = Total Produced − Total Sold − Expired Units

Expiry Rule:
  IF (Today − Production Date) > 2 days AND Balance > 0
  THEN mark as Pullout → count as Loss
```

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| Vue 3 (Composition API) | UI Framework |
| Pinia | State management |
| Vue Router 4 | Client-side routing |
| Vite | Build tool |
| jsPDF + jspdf-autotable | PDF generation |
| LocalStorage | Offline data persistence |

---

## 📦 Deploying to Vercel

1. Push the project to a GitHub repository
2. Go to https://vercel.com → New Project
3. Import the repository
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click **Deploy** ✅

---

## 💡 Tips

- All data is stored in your browser's **LocalStorage** — no internet needed after first load
- To reset all data: open browser DevTools → Application → LocalStorage → clear all `pt_*` keys
- For best experience, add to Home Screen on mobile (PWA-style)
