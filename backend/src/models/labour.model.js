const { runQuery, getAll, getOne } = require('../config/db');

const Labour = {
    // --- Labour Management ---
    create: async (data) => {
        try {
            const { name, type, gender, phone, address, employment_type, skill_level, daily_wage } = data;
            const result = await runQuery(
                `INSERT INTO labours (name, type, gender, phone, address, employment_type, skill_level, daily_wage) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, type, gender || null, phone || null, address || null, employment_type || null, skill_level || null, daily_wage]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    findAll: async () => {
        try {
            return await getAll('SELECT * FROM labours WHERE is_active = 1 ORDER BY name');
        } catch (error) {
            throw error;
        }
    },

    findById: async (id) => {
        try {
            return await getOne('SELECT * FROM labours WHERE id = ? AND is_active = 1', [id]);
        } catch (error) {
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const { name, type, gender, phone, address, employment_type, skill_level, daily_wage, status } = data;
            await runQuery(
                `UPDATE labours 
         SET name = ?, type = ?, gender = ?, phone = ?, address = ?, employment_type = ?, skill_level = ?, daily_wage = ?, status = ? 
         WHERE id = ?`,
                [name, type, gender, phone, address, employment_type, skill_level, daily_wage, status, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    delete: async (id) => {
        try {
            // Check for attendance/payments before deleting
            const attendance = await getOne('SELECT COUNT(*) as count FROM labour_attendance WHERE labour_id = ?', [id]);
            const payments = await getOne('SELECT COUNT(*) as count FROM labour_payments WHERE labour_id = ?', [id]);

            if (attendance.count > 0 || payments.count > 0) {
                throw new Error('Cannot delete labour with existing attendance or payment records');
            }

            // Soft Delete Only
            await runQuery('UPDATE labours SET is_active = 0 WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // --- Attendance Management ---


    getAttendance: async (projectId = null, date = null) => {
        try {
            let query = `
        SELECT la.*, l.name as labour_name, l.type as labour_type, p.name as project_name, 
               u.name as marked_by_name, lp.payment_date as paid_date
        FROM labour_attendance la
        JOIN labours l ON la.labour_id = l.id
        JOIN projects p ON la.project_id = p.id
        LEFT JOIN users u ON la.marked_by = u.id
        LEFT JOIN labour_payments lp ON la.labour_payment_id = lp.id
        WHERE l.is_active = 1
      `;
            const params = [];

            if (projectId) {
                query += ' AND la.project_id = ?';
                params.push(projectId);
            }
            if (date) {
                query += ' AND la.attendance_date = ?';
                params.push(date);
            }

            query += ' ORDER BY la.attendance_date DESC, l.name ASC';
            return await getAll(query, params);
        } catch (error) {
            throw error;
        }
    },

    markAttendance: async (data, userId) => {
        try {
            const { labour_id, project_id, attendance_date, attendance_type, work_hours, overtime_hours, notes, substitute_labour_id } = data;

            // Validation: One attendance per labour per project per date
            const existing = await getOne(
                'SELECT id FROM labour_attendance WHERE labour_id = ? AND project_id = ? AND attendance_date = ?',
                [labour_id, project_id, attendance_date]
            );

            if (existing) {
                throw new Error('Attendance already marked for this labour on this date');
            }

            // Block future dates
            const today = new Date().toISOString().split('T')[0];
            if (attendance_date > today) {
                throw new Error('Cannot mark attendance for future dates');
            }

            // Block inactive labour
            const labour = await Labour.findById(labour_id);
            if (!labour) throw new Error('Labour not found');
            // findById already checks is_active=1

            const result = await runQuery(
                `INSERT INTO labour_attendance (
                    labour_id, project_id, attendance_date, status, 
                    attendance_type, work_hours, overtime_hours, notes, 
                    substitute_labour_id, marked_by
                ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
                [
                    labour_id, project_id, attendance_date,
                    attendance_type || 'FULL', work_hours || 0, overtime_hours || 0, notes || null,
                    substitute_labour_id || null, userId
                ]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    confirmAttendance: async (id, userId) => {
        try {
            // Verify not already paid
            const att = await getOne('SELECT status, labour_payment_id FROM labour_attendance WHERE id = ?', [id]);
            if (!att) throw new Error('Attendance record not found');
            if (att.labour_payment_id) throw new Error('Cannot edit/confirm paid attendance');
            if (att.status === 'confirmed') return true; // Idempotent

            await runQuery(
                `UPDATE labour_attendance SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Bulk confirm for project/date
    confirmBulkAttendance: async (ids, userId) => {
        try {
            // Safe bulk update
            const placeholders = ids.map(() => '?').join(',');
            await runQuery(
                `UPDATE labour_attendance SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
                 WHERE id IN (${placeholders}) AND labour_payment_id IS NULL`,
                ids
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Link attendance to payment
    linkAttendanceToPayment: async (labourId, projectId, paymentDate, paymentId) => {
        try {
            // Find all CONFIRMED, UNPAID attendance for this labour/project up to payment_date
            await runQuery(
                `UPDATE labour_attendance 
                 SET labour_payment_id = ? 
                 WHERE labour_id = ? AND project_id = ? 
                 AND attendance_date <= ? 
                 AND status = 'confirmed' 
                 AND labour_payment_id IS NULL`,
                [paymentId, labourId, projectId, paymentDate]
            );
        } catch (error) {
            throw error;
        }
    },

    // --- Payment Management ---
    recordPayment: async (data) => {
        try {
            const { labour_id, project_id, stage_id, payment_date, payment_type, base_amount, overtime_amount, bonus_amount, deduction_amount, net_amount, payment_method, notes } = data;
            const result = await runQuery(
                `INSERT INTO labour_payments (labour_id, project_id, stage_id, payment_date, payment_type, base_amount, overtime_amount, bonus_amount, deduction_amount, net_amount, payment_method, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [labour_id, project_id, stage_id, payment_date, payment_type, base_amount, overtime_amount, bonus_amount, deduction_amount, net_amount, payment_method, notes]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    getPayments: async (labourId = null) => {
        try {
            let query = `
        SELECT lp.*, l.name as labour_name, p.name as project_name, ps.stage_name
        FROM labour_payments lp
        JOIN labours l ON lp.labour_id = l.id
        JOIN projects p ON lp.project_id = p.id
        LEFT JOIN project_stages ps ON lp.stage_id = ps.id
        WHERE 1=1
      `;
            const params = [];

            if (labourId) {
                query += ' AND lp.labour_id = ?';
                params.push(labourId);
            }

            query += ' ORDER BY lp.payment_date DESC';
            return await getAll(query, params);
        } catch (error) {
            throw error;
        }
    },

    // Get total advances for a labour on a project
    getAdvanceTotal: async (labourId, projectId) => {
        try {
            const result = await getOne(
                `SELECT COALESCE(SUM(net_amount - settled_amount), 0) as total_advance 
                 FROM labour_payments 
                 WHERE labour_id = ? AND project_id = ? AND payment_type = 'advance' AND (net_amount - settled_amount) > 0`,
                [labourId, projectId]
            );
            return result.total_advance;
        } catch (error) {
            throw error;
        }
    },

    // Get total penalties for a labour on a project (not yet deducted)
    getPenaltyTotal: async (labourId, projectId) => {
        try {
            const result = await getOne(
                `SELECT COALESCE(SUM(amount), 0) as total_penalty 
                 FROM labour_penalties 
                 WHERE labour_id = ? AND project_id = ? AND is_deducted = 0`,
                [labourId, projectId]
            );
            return result.total_penalty;
        } catch (error) {
            throw error;
        }
    },

    // --- Penalty Management ---
    recordPenalty: async (data) => {
        try {
            const { labour_id, project_id, penalty_date, penalty_type, amount, reason } = data;
            const result = await runQuery(
                `INSERT INTO labour_penalties (labour_id, project_id, penalty_date, penalty_type, amount, reason) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [labour_id, project_id, penalty_date, penalty_type, amount, reason]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    getPenalties: async (labourId = null, projectId = null) => {
        try {
            let query = `
                SELECT lpen.*, l.name as labour_name, p.name as project_name
                FROM labour_penalties lpen
                JOIN labours l ON lpen.labour_id = l.id
                JOIN projects p ON lpen.project_id = p.id
                WHERE 1=1
            `;
            const params = [];

            if (labourId) {
                query += ' AND lpen.labour_id = ?';
                params.push(labourId);
            }
            if (projectId) {
                query += ' AND lpen.project_id = ?';
                params.push(projectId);
            }

            query += ' ORDER BY lpen.penalty_date DESC';
            return await getAll(query, params);
        } catch (error) {
            throw error;
        }
    },

    // Mark penalties as deducted
    markPenaltiesDeducted: async (labourId, projectId, paymentId) => {
        try {
            await runQuery(
                `UPDATE labour_penalties 
                 SET is_deducted = 1, deducted_payment_id = ? 
                 WHERE labour_id = ? AND project_id = ? AND is_deducted = 0`,
                [paymentId, labourId, projectId]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Get accurate labour cost for a project (Gross accrued cost, ignoring advance deductions)
    getProjectLabourCost: async (projectId) => {
        try {
            // Get total GROSS WORK VALUE (Expense to company)
            // CRITICAL FIX: Sum base + overtime + bonus. DO NOT use net_amount (which has advance deductions).
            // Penalties are handled separately as cost reduction? Or logic: Cost = Work Value - Penalties.
            // User Prompt Rule: "Penalties reduce cost".
            const paymentsResult = await getOne(
                `SELECT COALESCE(SUM(base_amount + IFNULL(overtime_amount, 0) + IFNULL(bonus_amount, 0)), 0) as total_gross_cost
                 FROM labour_payments
                 WHERE project_id = ? AND payment_type != 'advance'`,
                [projectId]
            );

            // Get total penalties (these reduce net cost / liability)
            // Note: If penalties are deducted from pay, they are effectively "income" or "cost reduction" for the project.
            const penaltiesResult = await getOne(
                `SELECT COALESCE(SUM(amount), 0) as total_penalties
                 FROM labour_penalties
                 WHERE project_id = ? AND is_deducted = 1`,
                [projectId]
            );

            const totalGrossCost = paymentsResult.total_gross_cost || 0;
            const totalPenalties = penaltiesResult.total_penalties || 0;
            const netLabourCost = totalGrossCost - totalPenalties; // Correct Logic: Work Value - Penalties

            return {
                project_id: projectId,
                total_gross_cost: totalGrossCost,
                total_penalties_deducted: totalPenalties,
                net_labour_cost: netLabourCost
            };
        } catch (error) {
            throw error;
        }
    },

    // --- Project Stages ---
    addStage: async (data) => {
        try {
            const { project_id, stage_name, stage_order, payment_percentage, start_date } = data;
            const result = await runQuery(
                `INSERT INTO project_stages (project_id, stage_name, stage_order, payment_percentage, status, start_date) 
         VALUES (?, ?, ?, ?, 'pending', ?)`,
                [project_id, stage_name, stage_order, payment_percentage, start_date]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    getStages: async (projectId) => {
        try {
            return await getAll('SELECT * FROM project_stages WHERE project_id = ? ORDER BY stage_order', [projectId]);
        } catch (error) {
            throw error;
        }
    },

    // Distribute deduction amount across outstanding advances (FIFO)
    settleAdvances: async (labourId, projectId, deductionAmount) => {
        try {
            // Get outstanding advances ordered by date (FIFO)
            const advances = await getAll(
                `SELECT * FROM labour_payments 
                 WHERE labour_id = ? AND project_id = ? AND payment_type = 'advance' AND (net_amount - settled_amount) > 0
                 ORDER BY payment_date ASC`,
                [labourId, projectId]
            );

            let remainingToDeduct = deductionAmount;

            for (const adv of advances) {
                if (remainingToDeduct <= 0) break;

                const outstandingInThisAdvance = adv.net_amount - adv.settled_amount;
                const deductFromThis = Math.min(outstandingInThisAdvance, remainingToDeduct);

                await runQuery(
                    `UPDATE labour_payments SET settled_amount = settled_amount + ? WHERE id = ?`,
                    [deductFromThis, adv.id]
                );

                remainingToDeduct -= deductFromThis;
            }
            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Labour;
