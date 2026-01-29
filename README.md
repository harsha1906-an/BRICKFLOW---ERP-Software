# Construction ERP System - Version 1.0.0 [STABLE]

A comprehensive internal ERP system for real estate and construction companies to manage projects, inventory, procurement, expenses, payments, and generate financial reports.

## 🎯 Features

### Core Modules
- **Projects & Units** - Manage real estate projects and individual units
- **Inventory Management** - Transaction-based inventory tracking with stock calculations
- **Procurement** - Purchase orders with automatic inventory updates
- **Expense Tracking** - Append-only expense records with correction entries
- **Payments & Bookings** - Customer bookings with payment tracking and balance calculation
- **Reports & Analytics** - Comprehensive financial and operational reports

### Key Capabilities
- ✅ Real-time stock calculation from transactions
- ✅ Overpayment detection in payment processing
- ✅ Append-only data model for financial records
- ✅ Project-wise cost and profit analysis
- ✅ Material consumption tracking
- ✅ Complete audit trail

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Final Epr"
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

### Default Login
```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT**: Change the default password immediately after first login!

---

## 📁 Project Structure

```
Final Epr/
├── backend/
│   ├── database/
│   │   ├── init.sql          # Database schema
│   │   └── erp.db            # SQLite database (auto-created)
│   ├── scripts/
│   │   └── backup.js         # Database backup script
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js         # Database configuration
│   │   ├── controllers/      # API controllers
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.js       # JWT authentication
│   │   │   ├── logger.js     # Request logging
│   │   │   └── validators.js # Input validation
│   │   ├── models/           # Data models
│   │   ├── routes/           # API routes
│   │   └── server.js         # Express server
│   ├── .env.example          # Environment template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── context/          # React context (Auth)
    │   ├── pages/            # Page components
    │   ├── services/         # API services
    │   └── App.jsx           # Main app component
    └── package.json
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5001
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database
DB_PATH=./database/erp.db

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Production Configuration

For production, update:
- `NODE_ENV=production`
- `JWT_SECRET` - Use a strong random secret
- `JWT_EXPIRES_IN=8h` - Shorter expiration
- `DB_PATH` - Absolute path to database
- `CORS_ORIGIN` - Your production domain

---

## 💾 Database Backup

### Manual Backup
```bash
cd backend
npm run backup
```

This creates a timestamped backup in `backend/backups/` and automatically keeps only the last 7 backups.

### Automated Backups

**Option 1 - Cron Job (Linux/Mac):**
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/Final\ Epr/backend && npm run backup
```

**Option 2 - Windows Task Scheduler:**
Create a scheduled task to run:
```
cd C:\path\to\Final Epr\backend && npm run backup
```

---

## 📊 API Documentation

### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

### Projects & Units
```
GET    /api/projects
POST   /api/projects
GET    /api/units
POST   /api/units
```

### Inventory
```
GET    /api/materials
POST   /api/inventory/in
POST   /api/inventory/out
GET    /api/inventory/summary
```

### Procurement
```
GET    /api/suppliers
POST   /api/purchases
POST   /api/purchases/:id/confirm
```

### Expenses
```
GET    /api/expenses
POST   /api/expenses
POST   /api/expenses/:id/correct
GET    /api/expenses/summary
```

### Payments
```
GET    /api/customers
POST   /api/bookings
POST   /api/payments
GET    /api/payments/summary
```

### Reports
```
GET    /api/reports/stock-summary
GET    /api/reports/material-consumption
GET    /api/reports/project-costs
GET    /api/reports/income-expense
GET    /api/reports/project-profit
```

All routes (except `/api/auth/login`) require JWT authentication via `Authorization: Bearer <token>` header.

---

## 🚢 Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

**Backend:**
```bash
cd backend
npm start
```

### Deployment Options

#### Option 1: VPS (Ubuntu/Debian)

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Setup PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   cd backend
   pm2 start src/server.js --name erp-backend
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           root /path/to/Final Epr/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```

4. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

#### Option 2: Cloud Platforms

- **Backend**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify
- **Database**: Mount persistent volume for SQLite

---

## 🔒 Security

### Implemented
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Protected API routes
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Error handling without leaking details

### Recommendations
- Change default admin password
- Use strong JWT secret in production
- Enable HTTPS in production
- Regular database backups
- Monitor logs for suspicious activity

---

## 🧪 Testing

### Functional Testing Checklist
- [ ] Login/Logout works
- [ ] All CRUD operations work
- [ ] Reports generate correctly
- [ ] Payments calculate balances
- [ ] Inventory transactions update stock
- [ ] Overpayment warnings appear
- [ ] Correction entries work

### Error Testing
- [ ] Invalid login shows error
- [ ] Missing required fields rejected
- [ ] Negative amounts rejected
- [ ] Database errors handled gracefully

---

## 📝 Business Rules

### Inventory
- Stock is **never stored**, always calculated: `SUM(IN) - SUM(OUT)`
- Stock OUT blocked if insufficient stock
- All transactions are append-only

### Expenses
- Expenses are **never deleted**
- Editing creates correction entries (reversal + new)
- Complete audit trail maintained

### Payments
- Payments are **append-only**
- Balance = `agreed_price - SUM(payments)`
- Overpayment detection and warning
- Auto-complete booking when fully paid

### Reports
- All reports derived from transactions
- No stored totals
- Real-time calculations

---

## 🛠️ Troubleshooting

### Database locked error
```bash
# Stop all running servers
# Delete database and restart
cd backend
rm database/erp.db
npm run dev
```

### Port already in use
```bash
# Change PORT in .env file
PORT=5002
```

### CORS errors
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3000
```

---

## 📄 License

Internal use only - Proprietary software

---

## 👥 Support

For issues or questions, contact your system administrator.

---

## 🎉 Version History

### v1.0.0 (Current)
- ✅ All core modules implemented
- ✅ Reports and analytics
- ✅ Production-ready with error handling
- ✅ Database backup strategy
- ✅ Comprehensive documentation
