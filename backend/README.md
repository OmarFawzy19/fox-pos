# Fox POS — Backend

Node.js + Express + SQLite REST API for the Fox POS frontend.

## Quick Start

```bash
cd backend
npm install
node server.js
```

The server starts at **http://localhost:3001**

## Dev Mode (auto-restart on save)

```bash
npm run dev
```

## API Base URL

All endpoints are prefixed with `/api`.

The Vite frontend dev server (port 8080) proxies `/api` → `http://localhost:3001` automatically.

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/health | Health check |
| GET | /api/customers | List customers |
| POST | /api/customers | Add customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |
| GET | /api/suppliers | List suppliers (with products) |
| POST | /api/suppliers | Add supplier |
| PUT | /api/suppliers/:id | Update supplier |
| DELETE | /api/suppliers/:id | Delete supplier |
| GET | /api/inventory | List inventory |
| POST | /api/inventory | Add item (merges if same name) |
| PUT | /api/inventory/:id | Update item |
| PATCH | /api/inventory/deduct | Deduct stock |
| DELETE | /api/inventory/:id | Delete item |
| GET | /api/invoices | List invoices (with items) |
| GET | /api/invoices/next-number/:type | Next invoice number |
| POST | /api/invoices | Create invoice |
| DELETE | /api/invoices/:id | Delete invoice |
| GET | /api/payments | List payments |
| POST | /api/payments | Add payment |
| GET | /api/wallet | Get wallet balance |
| PATCH | /api/wallet/add | Add to wallet |
| PATCH | /api/wallet/deduct | Deduct from wallet |
| GET | /api/wallet/expenses | List expenses |
| POST | /api/wallet/expenses | Add expense |

## Running Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm install
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd ..   # back to project root
npm run dev
```

Then open http://localhost:8080
