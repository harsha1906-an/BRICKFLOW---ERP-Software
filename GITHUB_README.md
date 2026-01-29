# 🏗️ AI-Powered Construction ERP System (v1.0.0)

A professional, high-performance Construction ERP system designed with a **Liquid Glass** aesthetic and **Pitch Black** high-contrast theme. This full-stack application enables real estate and construction firms to manage multi-project workflows, inventory, financials, and procurement with real-time analytics.

![Liquid Glass UI](https://img.shields.io/badge/UI_Design-Liquid_Glass-blueviolet)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Node.js_|_SQLite-blue)

## ✨ Key Features

### 📊 Financial & Visual Analytics
- **Live Dashboard**: Real-time tracking of weekly income vs. expenses using gradient area charts.
- **Stock Intelligence**: Interactive pie charts for material distribution and bar charts for cost analysis.
- **Calculated Engine**: Stock and balances are calculated on-the-fly from transaction history (no stale totals).

### 🛠️ Core Modules
- **Project Management**: Track multi-site construction stages and unit inventory.
- **Inventory Control**: Transaction-based material tracking (IN/OUT) with automated low-stock detection.
- **Procurement & Purchase Orders**: Manage suppliers and procurement workflows.
- **Expense Tracking**: Append-only ledger with automated correction entry generation for audit stability.
- **Payment & EMI**: Customer booking management with balance calculations and overpayment protection.

### 📱 Premium UX/UI
- **Pitch Black Theme**: Deep contrast design optimized for OLED displays.
- **Liquid Glass Aesthetic**: Modern backdrop-blur effects and translucent containers.
- **Fully Responsive**: Optimized for desktop, tablet, and mobile with custom responsive scrolling tables.

## 🚀 Tech Stack

**Frontend:**
- React 19 (Vite)
- Recharts (Visual Analytics)
- Vanilla CSS (Custom Design System)
- Axios (API Communication)

**Backend:**
- Node.js & Express
- SQLite (Self-Contained Database)
- JWT (Authentication & RBAC)
- Winston (Audit Logging)
- Helmet & Rate-Limiter (Security)

## 📦 Installation & Setup

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-username/construction-erp.git
   cd construction-erp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update JWT_SECRET and other vars
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🔐 Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 📄 License
This project is proprietary and intended for internal use.

---
*Developed with a focus on auditability, data integrity, and premium user experience.*
