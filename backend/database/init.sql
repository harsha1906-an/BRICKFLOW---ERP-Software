-- Users table with authentication and role management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ACCOUNTANT', 'SITE', 'SALES')),
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Seed admin user (password: admin123)
-- Password hash generated with bcrypt for 'admin123'
INSERT OR IGNORE INTO users (id, name, username, password, role) 
VALUES (1, 'Admin User', 'admin', '$2b$10$CcICD7TYpw8TSo1e1buQkuLHy6RFYDQoWkKQ9x///XYrwduPXPZL', 'ADMIN');

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('planning', 'ongoing', 'completed')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index onprojects status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Payment Methods (Moved to top for FK dependency)
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO payment_methods (code, name) VALUES 
('CASH', 'Cash'),
('CHECK', 'Check'),
('UPI', 'UPI'),
('BANK_TRANSFER', 'Bank Transfer');

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  unit_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('3BHK', '4BHK')),
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('available', 'booked', 'sold')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(project_id, unit_number)
);

-- Create index on units project_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);

-- Sample projects
INSERT OR IGNORE INTO projects (id, name, location, start_date, status) VALUES
(1, 'Green Valley Villas', 'Whitefield, Bangalore', '2024-01-15', 'ongoing'),
(2, 'Sunset Heights', 'Electronic City, Bangalore', '2023-06-01', 'completed'),
(3, 'Royal Gardens', 'Sarjapur Road, Bangalore', '2024-03-01', 'planning');

-- Sample units
INSERT OR IGNORE INTO units (project_id, unit_number, type, price, status) VALUES
(1, 'A101', '3BHK', 8500000, 'available'),
(1, 'A102', '3BHK', 8500000, 'booked'),
(1, 'A201', '4BHK', 12000000, 'available'),
(1, 'B101', '3BHK', 8700000, 'available'),
(2, 'B101', '3BHK', 7500000, 'sold'),
(2, 'B102', '4BHK', 10500000, 'sold'),
(2, 'B201', '3BHK', 7800000, 'sold');

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Materials table (master data)
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL, -- Total including GST if applicable
  base_amount DECIMAL(10, 2), -- Amount before GST
  has_gst INTEGER DEFAULT 0,
  gst_percentage DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  is_accountable INTEGER DEFAULT 1, -- 1=accountable, 0=non-accountable
  status TEXT NOT NULL CHECK(status IN ('draft', 'confirmed', 'cancelled')) DEFAULT 'draft',
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK(quantity > 0),
  rate DECIMAL(10, 2) NOT NULL CHECK(rate >= 0),
  amount DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  FOREIGN KEY (material_id) REFERENCES materials(id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_material ON purchase_items(material_id);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL,
  project_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
  quantity DECIMAL(10, 2) NOT NULL CHECK(quantity > 0),
  reference_type TEXT NOT NULL CHECK(reference_type IN ('purchase', 'purchase_order', 'usage', 'adjustment', 'return')),
  reference_id INTEGER,
  notes TEXT,
  usage_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_material ON inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_project ON inventory_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory_transactions(type);

-- Sample suppliers
INSERT OR IGNORE INTO suppliers (id, name, contact_person, phone, email) VALUES
(1, 'ABC Cement Suppliers', 'Rajesh Kumar', '9876543210', 'rajesh@abccement.com'),
(2, 'XYZ Steel Industries', 'Priya Sharma', '9876543211', 'priya@xyzsteel.com'),
(3, 'BuildMart Materials', 'Amit Patel', '9876543212', 'amit@buildmart.com');

-- Sample materials
INSERT OR IGNORE INTO materials (id, name, unit) VALUES
(1, 'Cement', 'bags'),
(2, 'Sand', 'tons'),
(3, 'Steel Bars', 'tons'),
(4, 'Bricks', 'pieces'),
(5, 'Gravel', 'cubic meters');

-- Sample purchases
INSERT OR IGNORE INTO purchases (id, supplier_id, purchase_date, total_amount, status, notes) VALUES
(1, 1, '2024-01-10', 250000, 'confirmed', 'Initial cement stock'),
(2, 2, '2024-01-15', 450000, 'confirmed', 'Steel for Green Valley project'),
(3, 3, '2024-01-20', 180000, 'confirmed', 'Sand and gravel');

-- Sample purchase items
INSERT OR IGNORE INTO purchase_items (purchase_id, material_id, quantity, rate, amount) VALUES
(1, 1, 500, 500, 250000),
(2, 3, 10, 45000, 450000),
(3, 2, 15, 8000, 120000),
(3, 5, 12, 5000, 60000);

-- Sample inventory transactions (from confirmed purchases)
INSERT OR IGNORE INTO inventory_transactions (material_id, type, quantity, reference_type, reference_id, notes) VALUES
(1, 'IN', 500, 'purchase', 1, 'Purchase #1 - Initial cement stock'),
(3, 'IN', 10, 'purchase', 2, 'Purchase #2 - Steel for Green Valley project'),
(2, 'IN', 15, 'purchase', 3, 'Purchase #3 - Sand and gravel'),
(5, 'IN', 12, 'purchase', 3, 'Purchase #3 - Sand and gravel'),
(1, 'OUT', 100, 'usage', NULL, 'Used in Green Valley Villas - Foundation work'),
(2, 'OUT', 3, 'usage', NULL, 'Used in Green Valley Villas - Foundation work');

-- Expenses table (append-only model)
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date DATE NOT NULL,
  project_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('labour', 'transport', 'machinery', 'utilities', 'permits', 'other')),
  amount DECIMAL(10, 2) NOT NULL, -- Total amount (base + GST if applicable)
  base_amount DECIMAL(10, 2), -- Amount before GST
  has_gst INTEGER DEFAULT 0, -- 1=has GST, 0=no GST
  gst_percentage DECIMAL(5, 2) DEFAULT 0, -- GST % (5, 12, 18, 28)
  gst_amount DECIMAL(10, 2) DEFAULT 0, -- Calculated GST amount
  is_accountable INTEGER DEFAULT 1, -- 1=accountable (white money), 0=non-accountable (cash/black)
  notes TEXT,
  is_correction INTEGER DEFAULT 0,
  corrects_expense_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (corrects_expense_id) REFERENCES expenses(id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Sample expenses
INSERT OR IGNORE INTO expenses (id, expense_date, project_id, category, amount, notes) VALUES
(1, '2024-01-15', 1, 'labour', 50000, 'Foundation work - Week 1'),
(2, '2024-01-20', 1, 'transport', 15000, 'Material delivery'),
(3, '2024-01-22', 1, 'machinery', 35000, 'Excavator rental - 3 days'),
(4, '2024-02-01', 2, 'labour', 75000, 'Construction crew - February'),
(5, '2024-02-05', 2, 'permits', 25000, 'Building permits and approvals'),
(6, '2024-02-10', 1, 'utilities', 8000, 'Electricity and water - February');

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  source TEXT, 
  current_status TEXT DEFAULT 'new',
  assigned_to INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  agreed_price DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'booked' CHECK(status IN ('booked', 'completed', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_unit ON bookings(unit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Payments table (append-only)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK(amount > 0),
  payment_method_id INTEGER, -- FK to payment_methods
  reference_number TEXT,
  notes TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Sample customers
INSERT OR IGNORE INTO customers (id, name, phone, email, address, is_active) VALUES
(1, 'Rajesh Kumar', '9876543210', 'rajesh@example.com', '123 MG Road, Bangalore', 1),
(2, 'Priya Sharma', '9876543211', 'priya@example.com', '456 Park Street, Mumbai', 1),
(3, 'Amit Patel', '9876543212', 'amit@example.com', '789 Ring Road, Ahmedabad', 1);

-- Sample bookings
INSERT OR IGNORE INTO bookings (id, customer_id, unit_id, booking_date, agreed_price, status, notes) VALUES
(1, 1, 1, '2024-01-10', 4500000, 'booked', 'Booking for Unit A-101'),
(2, 2, 4, '2024-01-15', 5200000, 'booked', 'Booking for Unit B-201'),
(3, 3, 7, '2024-02-01', 4800000, 'booked', 'Booking for Unit C-301');

-- Sample payments
-- Sample payments (Removed to avoid schema conflict - use seed-data.js)

-- Labour Management Tables

-- Labours table
CREATE TABLE IF NOT EXISTS labours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- carpenter, mason, etc.
  gender TEXT NOT NULL, -- male, female
  phone TEXT,
  address TEXT,
  employment_type TEXT DEFAULT 'daily', -- daily, contract, permanent
  skill_level TEXT DEFAULT 'skilled',
  daily_wage REAL NOT NULL,
  status TEXT DEFAULT 'active',
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labour Attendance table
CREATE TABLE IF NOT EXISTS labour_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  labour_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL, -- present, absent, half_day, leave
  time_in TIME,
  time_out TIME,
  work_hours REAL,
  overtime_hours REAL DEFAULT 0,
  notes TEXT,
  substitute_labour_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (labour_id) REFERENCES labours(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (substitute_labour_id) REFERENCES labours(id)
);

-- Project Stages table
CREATE TABLE IF NOT EXISTS project_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  stage_name TEXT NOT NULL, -- foundation, plinth, etc.
  stage_order INTEGER NOT NULL,
  completion_percentage REAL DEFAULT 0,
  payment_percentage REAL NOT NULL, -- % of total to pay at this stage
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Labour Payments table
CREATE TABLE IF NOT EXISTS labour_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  labour_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  stage_id INTEGER, -- NULL for daily payments
  payment_date DATE NOT NULL,
  payment_type TEXT NOT NULL, -- daily, stage, advance, bonus
  base_amount REAL NOT NULL,
  overtime_amount REAL DEFAULT 0,
  bonus_amount REAL DEFAULT 0,
  deduction_amount REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (labour_id) REFERENCES labours(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (stage_id) REFERENCES project_stages(id)
);

-- Labour Penalties table
CREATE TABLE IF NOT EXISTS labour_penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  labour_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  penalty_date DATE NOT NULL,
  penalty_type TEXT NOT NULL, -- absence, damage, quality_issue, late, other
  amount DECIMAL(10, 2) NOT NULL CHECK(amount >= 0),
  reason TEXT NOT NULL,
  is_deducted INTEGER DEFAULT 0, -- 0=pending, 1=deducted from payment
  deducted_payment_id INTEGER, -- Link to payment where deducted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (labour_id) REFERENCES labours(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (deducted_payment_id) REFERENCES labour_payments(id)
);

CREATE INDEX IF NOT EXISTS idx_labour_penalties_labour ON labour_penalties(labour_id);
CREATE INDEX IF NOT EXISTS idx_labour_penalties_project ON labour_penalties(project_id);
CREATE INDEX IF NOT EXISTS idx_labour_penalties_deducted ON labour_penalties(is_deducted);

-- Sample Data for Labour Module
INSERT OR IGNORE INTO labours (id, name, type, gender, phone, employment_type, skill_level, daily_wage) VALUES
(1, 'Ramesh Kumar', 'mason', 'male', '9000000001', 'daily', 'skilled', 800),
(2, 'Suresh Singh', 'carpenter', 'male', '9000000002', 'contract', 'skilled', 900),
(3, 'Anita Devi', 'helper', 'female', '9000000003', 'daily', 'unskilled', 500);

-- Sample Project Stages for Project 1
INSERT OR IGNORE INTO project_stages (id, project_id, stage_name, stage_order, payment_percentage, status) VALUES
(1, 1, 'Foundation', 1, 20, 'completed'),
(2, 1, 'Plinth Level', 2, 15, 'in_progress'),
(3, 1, 'Superstructure', 3, 25, 'pending'),
(4, 1, 'Roofing', 4, 20, 'pending'),
(5, 1, 'Finishing', 5, 20, 'pending');


-- Customer Analytics Module

-- Update Customer table (Logic handled in app, schema for new installs)
-- Note: SQLite init scripts usually create fresh. We assume the CREATE TABLE for customers above is updated or we alter it here if order matters. 
-- Ideally we'd update the CREATE TABLE customers definition at the top, but for now we'll append the ALTERs for clarity or just rely on the migration logic for existing. 
-- However, for a clean INIT, let's add the tables.

CREATE TABLE IF NOT EXISTS customer_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  visit_date DATE NOT NULL,
  visit_type TEXT DEFAULT 'walk-in', -- walk-in, scheduled, follow-up
  project_id INTEGER,
  unit_id INTEGER,
  budget_min REAL,
  budget_max REAL,
  source TEXT, -- reference, advertisement, website, etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS customer_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  status TEXT NOT NULL, -- new, contacted, interested, negotiating, converted, lost
  status_date DATE NOT NULL,
  follow_up_date DATE,
  priority TEXT DEFAULT 'medium', -- high, medium, low
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS customer_lost_reasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  lost_date DATE NOT NULL,
  reason TEXT NOT NULL, -- price, location, amenities, financing, competitor, other
  detailed_reason TEXT,
  competitor_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Purchase Orders Module
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  project_id INTEGER NOT NULL,
  supplier_id INTEGER NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, rejected, ordered, received, cancelled
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Note: We also added 'usage_reason' to inventory_transactions via migration
-- but since that table is defined earlier, we should ideally update its definition there or alter here.
-- For clarity/init, we'll leave the earlier definition as is and assume migration handles it, 
-- or we can update the definition on line 123 if we were starting fresh.

-- Approval System Module
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('purchase_order', 'expense')),
  entity_id INTEGER NOT NULL,
  requester_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  action_date DATETIME,
  actioned_by INTEGER,
  comments TEXT,
  amount DECIMAL(10, 2),
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (actioned_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON approvals(entity_type, entity_id);

-- Enhanced Payments (Phase 2c)
CREATE TABLE IF NOT EXISTS customer_loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  loan_account_number TEXT,
  sanctioned_amount DECIMAL(12, 2) NOT NULL,
  disbursed_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS payment_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT, 
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'partially_paid')),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Note: bookings table logically has payment_plan ADDED
-- Note: payments table logically has schedule_id ADDED

-- Audit Logs table - Track all system changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity_type TEXT NOT NULL, -- table/resource name (projects, expenses, etc.)
  entity_id INTEGER, -- ID of the affected record
  old_values TEXT, -- JSON - state before change
  new_values TEXT, -- JSON - state after change
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- Payment Requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  amount_requested DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'cancelled')),
  request_date DATE NOT NULL,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_date DATE,
  notes TEXT,
  created_by INTEGER,
  payment_id INTEGER, -- Links to payment when paid
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_booking ON payment_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_customer ON payment_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_due_date ON payment_requests(due_date);

-- Petty Cash Accounts table
CREATE TABLE IF NOT EXISTS petty_cash_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_replenishment_date DATE,
  last_replenishment_amount DECIMAL(10, 2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Petty Cash Transactions table
CREATE TABLE IF NOT EXISTS petty_cash_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('disbursement', 'receipt', 'replenishment')),
  amount DECIMAL(10, 2) NOT NULL CHECK(amount > 0), -- Total amount
  base_amount DECIMAL(10, 2), -- Amount before GST
  has_gst INTEGER DEFAULT 0,
  gst_percentage DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  is_accountable INTEGER DEFAULT 1, -- 1=accountable, 0=non-accountable
  category TEXT CHECK(category IN ('transport', 'food', 'materials', 'utilities', 'misc')),
  description TEXT NOT NULL,
  receipt_number TEXT,
  approved_by INTEGER,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);


CREATE INDEX IF NOT EXISTS idx_petty_cash_project ON petty_cash_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_user ON petty_cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_date ON petty_cash_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_petty_cash_type ON petty_cash_transactions(type);

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'purchase_approval', 'expense_approval', 'payment_approval',
    'inventory_restock', 'payment_received', 'booking_created',
    'low_stock_alert', 'project_milestone', 'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id INTEGER,
  related_type TEXT CHECK(related_type IN ('purchase', 'expense', 'payment', 'inventory', 'booking', 'project')),
  action_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Construction Stages (Master Data)
CREATE TABLE IF NOT EXISTS construction_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  weightage DECIMAL(5, 2) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO construction_stages (id, name, sequence_order, weightage) VALUES
(1, 'Foundation', 1, 15.00),
(2, 'Structure', 2, 25.00),
(3, 'Finishing', 3, 30.00),
(4, 'Handover', 4, 30.00);

-- Unit Progress Tracking
CREATE TABLE IF NOT EXISTS unit_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  completion_date DATETIME,
  remarks TEXT,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (stage_id) REFERENCES construction_stages(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  UNIQUE(unit_id, stage_id)
);

