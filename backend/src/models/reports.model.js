const { getAll, getOne } = require('../config/db');

const Reports = {
  // Stock summary - current stock levels
  getStockSummary: async () => {
    try {
      const stockSummary = await getAll(`
        SELECT 
          m.id,
          m.name,
          m.unit,
          COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.quantity ELSE -it.quantity END), 0) as current_stock
        FROM materials m
        LEFT JOIN inventory_transactions it ON m.id = it.material_id
        GROUP BY m.id, m.name, m.unit
        ORDER BY m.name
      `);
      return stockSummary;
    } catch (error) {
      throw error;
    }
  },

  // Material consumption by project
  getMaterialConsumption: async (projectId = null) => {
    try {
      let query = `
        SELECT 
          p.id as project_id,
          p.name as project_name,
          m.name as material_name,
          m.unit,
          SUM(it.quantity) as quantity_used
        FROM inventory_transactions it
        JOIN materials m ON it.material_id = m.id
        JOIN projects p ON it.project_id = p.id
        WHERE it.type = 'OUT'
      `;

      const params = [];
      if (projectId) {
        query += ' AND it.project_id = ?';
        params.push(projectId);
      }

      query += ' GROUP BY p.id, p.name, m.name, m.unit ORDER BY p.name, m.name';

      const consumption = await getAll(query, params);
      return consumption;
    } catch (error) {
      throw error;
    }
  },

  // Project costs (expenses only - simplified)
  getProjectCosts: async () => {
    try {
      // Fetch base project info + expenses
      const projects = await getAll(`
        SELECT 
          p.id,
          p.name as project_name,
          COALESCE(SUM(e.amount), 0) as total_expenses,
          COUNT(e.id) as expense_count
        FROM projects p
        LEFT JOIN expenses e ON p.id = e.project_id
        GROUP BY p.id, p.name
      `);

      const Labour = require('./labour.model');

      // Enhance with Labour and Material Costs
      const detailedCosts = await Promise.all(projects.map(async (p) => {
        // Labour
        const lCost = await Labour.getProjectLabourCost(p.id);

        // Material
        const mCost = await getOne(`
             SELECT COALESCE(SUM(it.quantity * (
                SELECT rate FROM purchase_items pi WHERE pi.material_id = m.id ORDER BY pi.id DESC LIMIT 1
             )), 0) as material_cost
             FROM inventory_transactions it
             JOIN materials m ON it.material_id = m.id
             WHERE it.project_id = ? AND it.type = 'OUT'
          `, [p.id]);

        return {
          ...p,
          labour_cost: lCost.net_labour_cost, // Gross - penalties
          material_cost: mCost.material_cost || 0,
          total_project_cost: p.total_expenses + lCost.net_labour_cost + (mCost.material_cost || 0)
        };
      }));

      // Sort by total cost descending
      detailedCosts.sort((a, b) => b.total_project_cost - a.total_project_cost);

      return detailedCosts;
    } catch (error) {
      throw error;
    }
  },

  // Income vs Expense
  getIncomeExpense: async () => {
    try {
      // Get total income from payments
      const incomeResult = await getOne(`
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM payments
      `);

      // Get total expenses
      const expenseResult = await getOne(`
        SELECT COALESCE(SUM(amount), 0) as total_expenses
        FROM expenses
      `);

      // Get total purchases
      const purchaseResult = await getOne(`
        SELECT COALESCE(SUM(total_amount), 0) as total_purchases
        FROM purchases
        WHERE status = 'confirmed'
      `);

      const totalIncome = incomeResult.total_income || 0;
      const totalExpenses = expenseResult.total_expenses || 0;
      const totalPurchases = purchaseResult.total_purchases || 0;
      const totalCosts = totalExpenses + totalPurchases;
      const netProfit = totalIncome - totalCosts;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      return {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        total_purchases: totalPurchases,
        total_costs: totalCosts,
        net_profit: netProfit,
        profit_margin: profitMargin
      };
    } catch (error) {
      throw error;
    }
  },

  // Project profit estimation
  getProjectProfit: async () => {
    try {
      const Labour = require('./labour.model');

      const projectProfit = await getAll(`
        SELECT 
          p.id,
          p.name as project_name,
          p.status,
          -- Total units
          COUNT(DISTINCT u.id) as total_units,
          -- Booked units
          COUNT(DISTINCT CASE WHEN b.id IS NOT NULL AND b.status != 'cancelled' THEN b.id END) as booked_units,
          -- Revenue (from bookings)
          COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.agreed_price ELSE 0 END), 0) as total_revenue,
          -- Collected (from payments)
          COALESCE(SUM(pay.amount), 0) as total_collected,
          -- Outstanding
          COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.agreed_price ELSE 0 END), 0) - COALESCE(SUM(pay.amount), 0) as outstanding,
          -- Expenses (non-labour)
          COALESCE(SUM(e.amount), 0) as total_expenses
        FROM projects p
        LEFT JOIN units u ON p.id = u.project_id
        LEFT JOIN bookings b ON u.id = b.unit_id
        LEFT JOIN payments pay ON b.id = pay.booking_id
        LEFT JOIN expenses e ON p.id = e.project_id
        GROUP BY p.id, p.name, p.status
        ORDER BY p.name
      `);

      // Add labour and material costs for each project
      for (const project of projectProfit) {
        // 1. Labour Cost (Gross Accrual)
        const labourCost = await Labour.getProjectLabourCost(project.id);
        project.labour_cost = labourCost.net_labour_cost; // This is now GROSS - PENALTIES
        project.labour_penalties_deducted = labourCost.total_penalties_deducted;

        // 2. Material Cost (Consumption * Price)
        const materialResult = await getOne(`
             SELECT COALESCE(SUM(it.quantity * (
                SELECT rate FROM purchase_items pi WHERE pi.material_id = m.id ORDER BY pi.id DESC LIMIT 1
             )), 0) as material_cost
             FROM inventory_transactions it
             JOIN materials m ON it.material_id = m.id
             WHERE it.project_id = ? AND it.type = 'OUT'
        `, [project.id]);
        project.material_cost = materialResult.material_cost || 0;

        // 3. Total Costs = Expenses + Labour + Material
        project.total_costs = project.total_expenses + project.labour_cost + project.material_cost;

        // 4. Profit
        project.estimated_profit = project.total_revenue - project.total_costs;
        project.profit_margin = project.total_revenue > 0
          ? ((project.estimated_profit / project.total_revenue) * 100).toFixed(2)
          : 0;
      }

      // Sort by estimated profit descending
      projectProfit.sort((a, b) => b.estimated_profit - a.estimated_profit);

      return projectProfit;
    } catch (error) {
      throw error;
    }
  },

  // Dashboard summary - key metrics
  getDashboardSummary: async () => {
    try {
      // Projects summary
      const projectsResult = await getOne(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects
        FROM projects
      `);

      // Units summary
      const unitsResult = await getOne(`
        SELECT 
          COUNT(*) as total_units,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_units,
          COUNT(CASE WHEN status = 'booked' THEN 1 END) as booked_units,
          COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_units
        FROM units
      `);

      // Bookings summary
      const bookingsResult = await getOne(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'booked' THEN 1 END) as active_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
        FROM bookings
      `);

      // Financial summary
      const financialResult = await getOne(`
        SELECT 
          COALESCE(SUM(b.agreed_price), 0) as total_booking_value,
          COALESCE((SELECT SUM(amount) FROM payments), 0) as total_collected,
          COALESCE((SELECT SUM(amount) FROM expenses), 0) as total_expenses
        FROM bookings b
        WHERE b.status != 'cancelled'
      `);

      // Inventory summary
      const inventoryResult = await getOne(`
        SELECT 
          COUNT(DISTINCT material_id) as total_materials,
          COUNT(*) as total_transactions
        FROM inventory_transactions
      `);

      return {
        projects: projectsResult,
        units: unitsResult,
        bookings: bookingsResult,
        financial: {
          ...financialResult,
          outstanding: financialResult.total_booking_value - financialResult.total_collected,
          net_position: financialResult.total_collected - financialResult.total_expenses
        },
        inventory: inventoryResult
      };
    } catch (error) {
      throw error;
    }
  },

  // === PHASE 2: FINANCIAL ANALYTICS ===

  // Income breakdown by accounting type
  getIncomeBreakdown: async () => {
    try {
      const breakdown = await getAll(`
        SELECT 
          p.accounting_type,
          COUNT(*) as payment_count,
          SUM(p.amount) as total_amount,
          SUM(CASE WHEN p.accounting_type = 'accountable' THEN p.gst_amount ELSE 0 END) as gst_collected
        FROM payments p
        GROUP BY p.accounting_type
      `);
      return breakdown;
    } catch (error) {
      throw error;
    }
  },

  // Financial timeline (monthly income vs expense)
  getFinancialTimeline: async () => {
    try {
      // Income by month
      const income = await getAll(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          SUM(amount) as income
        FROM payments
        GROUP BY month
        ORDER BY month
      `);

      // Expenses by month
      const expenses = await getAll(`
        SELECT 
          strftime('%Y-%m', expense_date) as month,
          SUM(amount) as expense
        FROM expenses
        GROUP BY month
        ORDER BY month
      `);

      // Merge income and expense data
      const months = new Set([...income.map(i => i.month), ...expenses.map(e => e.month)]);
      const timeline = Array.from(months).sort().map(month => {
        const incomeData = income.find(i => i.month === month) || { income: 0 };
        const expenseData = expenses.find(e => e.month === month) || { expense: 0 };
        return {
          month,
          income: incomeData.income || 0,
          expense: expenseData.expense || 0,
          net: (incomeData.income || 0) - (expenseData.expense || 0)
        };
      });

      return timeline;
    } catch (error) {
      throw error;
    }
  },

  // Profit trend (income - all costs by month)
  getProfitTrend: async () => {
    try {
      // Get monthly income
      const income = await getAll(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          SUM(amount) as income
        FROM payments
        GROUP BY month
      `);

      // Get monthly expenses
      const expenses = await getAll(`
        SELECT 
          strftime('%Y-%m', expense_date) as month,
          SUM(amount) as expense
        FROM expenses
        GROUP BY month
      `);

      // Get monthly labour costs
      const labourCosts = await getAll(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          SUM(base_amount + COALESCE(overtime_amount, 0) + COALESCE(bonus_amount, 0)) as labour_cost
        FROM labour_payments
        WHERE payment_type != 'advance'
        GROUP BY month
      `);

      // Get monthly material costs
      const materialCosts = await getAll(`
        SELECT 
          strftime('%Y-%m', it.created_at) as month,
          SUM(it.quantity * COALESCE((
            SELECT rate FROM purchase_items pi WHERE pi.material_id = m.id ORDER BY pi.id DESC LIMIT 1
          ), 0)) as material_cost
        FROM inventory_transactions it
        JOIN materials m ON it.material_id = m.id
        WHERE it.type = 'OUT'
        GROUP BY month
      `);

      // Merge all data
      const months = new Set([
        ...income.map(i => i.month),
        ...expenses.map(e => e.month),
        ...labourCosts.map(l => l.month),
        ...materialCosts.map(m => m.month)
      ]);

      const profitTrend = Array.from(months).sort().map(month => {
        const inc = income.find(i => i.month === month)?.income || 0;
        const exp = expenses.find(e => e.month === month)?.expense || 0;
        const lab = labourCosts.find(l => l.month === month)?.labour_cost || 0;
        const mat = materialCosts.find(m => m.month === month)?.material_cost || 0;
        const totalCost = exp + lab + mat;
        return {
          month,
          income: inc,
          expenses: exp,
          labour_cost: lab,
          material_cost: mat,
          total_cost: totalCost,
          profit: inc - totalCost
        };
      });

      return profitTrend;
    } catch (error) {
      throw error;
    }
  },

  // === PHASE 3: PROJECT PROGRESS ANALYTICS ===

  // Site-wise progress bars
  getProjectProgress: async () => {
    try {
      const progress = await getAll(`
        SELECT 
          p.id,
          p.name as project_name,
          p.status,
          COUNT(DISTINCT u.id) as total_units,
          COALESCE(AVG(unit_pct.progress_percentage), 0) as avg_progress_percentage
        FROM projects p
        LEFT JOIN units u ON p.id = u.project_id
        LEFT JOIN (
          SELECT 
            up.unit_id,
            SUM(CASE WHEN up.status = 'COMPLETED' THEN cs.default_percentage ELSE 0 END) as progress_percentage
          FROM unit_progress up
          JOIN construction_stages cs ON up.stage_id = cs.id
          GROUP BY up.unit_id
        ) unit_pct ON u.id = unit_pct.unit_id
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, p.status
        ORDER BY p.name
      `);
      return progress;
    } catch (error) {
      throw error;
    }
  },

  // Stage bottleneck analysis
  getStageBottlenecks: async () => {
    try {
      const bottlenecks = await getAll(`
        SELECT 
          up.stage,
          COUNT(*) as units_in_stage,
          ROUND(AVG(julianday('now') - julianday(up.started_at)), 1) as avg_days_in_stage,
          COUNT(DISTINCT up.project_id) as projects_affected
        FROM unit_progress up
        WHERE up.status = 'in_progress'
        GROUP BY up.stage
        ORDER BY units_in_stage DESC
      `);
      return bottlenecks;
    } catch (error) {
      throw error;
    }
  },

  // === PHASE 4: CUSTOMER & PAYMENT ANALYTICS ===

  // Payment status distribution
  getPaymentStatusDistribution: async () => {
    try {
      const distribution = await getAll(`
        SELECT 
          b.status,
          COUNT(*) as booking_count,
          SUM(b.agreed_price) as total_value,
          SUM(COALESCE(pay_total.amount, 0)) as collected,
          SUM(b.agreed_price) - SUM(COALESCE(pay_total.amount, 0)) as outstanding
        FROM bookings b
        LEFT JOIN (
          SELECT booking_id, SUM(amount) as amount
          FROM payments
          GROUP BY booking_id
        ) pay_total ON b.id = pay_total.booking_id
        GROUP BY b.status
        ORDER BY booking_count DESC
      `);
      return distribution;
    } catch (error) {
      throw error;
    }
  },

  // Customer conversion funnel
  getConversionFunnel: async () => {
    try {
      const funnel = await getOne(`
        SELECT 
          COUNT(DISTINCT u.id) as total_units,
          COUNT(DISTINCT CASE WHEN b.status IN ('booked', 'completed') THEN b.unit_id END) as booked_units,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.unit_id END) as sold_units,
          ROUND((COUNT(DISTINCT CASE WHEN b.status IN ('booked', 'completed') THEN b.unit_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT u.id), 0)), 2) as booking_rate,
          ROUND((COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.unit_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT u.id), 0)), 2) as conversion_rate
        FROM units u
        LEFT JOIN bookings b ON u.id = b.unit_id AND b.status != 'cancelled'
      `);
      return funnel;
    } catch (error) {
      throw error;
    }
  },

  // === PHASE 5: LABOUR & INVENTORY ANALYTICS ===

  // Labour cost trend (gross wages only)
  getLabourCostTrend: async () => {
    try {
      const trend = await getAll(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          COUNT(*) as payment_count,
          SUM(base_amount + COALESCE(overtime_amount, 0) + COALESCE(bonus_amount, 0)) as gross_wages,
          SUM(deduction_amount) as total_deductions,
          SUM(net_amount) as net_paid
        FROM labour_payments
        WHERE payment_type = 'daily'
        GROUP BY month
        ORDER BY month
      `);
      return trend;
    } catch (error) {
      throw error;
    }
  },

  // Material purchase vs consumption flow
  getMaterialFlow: async () => {
    try {
      const flow = await getAll(`
        SELECT 
          m.id,
          m.name as material_name,
          m.unit,
          COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.quantity ELSE 0 END), 0) as total_purchased,
          COALESCE(SUM(CASE WHEN it.type = 'OUT' THEN it.quantity ELSE 0 END), 0) as total_consumed,
          COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.quantity ELSE -it.quantity END), 0) as current_stock,
          ROUND((COALESCE(SUM(CASE WHEN it.type = 'OUT' THEN it.quantity ELSE 0 END), 0) * 100.0 / 
            NULLIF(SUM(CASE WHEN it.type = 'IN' THEN it.quantity ELSE 0 END), 0)), 2) as utilization_rate
        FROM materials m
        LEFT JOIN inventory_transactions it ON m.id = it.material_id
        GROUP BY m.id, m.name, m.unit
        ORDER BY total_consumed DESC
      `);
      return flow;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Reports;
