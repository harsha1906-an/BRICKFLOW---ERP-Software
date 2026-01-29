const { getAll, runQuery } = require('../config/db');

const Approval = {
    // Create new approval request
    create: async (data, userId) => {
        try {
            const { entity_type, entity_id, amount, comments } = data;
            const result = await runQuery(
                `INSERT INTO approvals (entity_type, entity_id, requester_id, amount, comments) 
                 VALUES (?, ?, ?, ?, ?)`,
                [entity_type, entity_id, userId, amount, comments]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Get all pending approvals
    getPending: async () => {
        try {
            // Join with users to get requester name
            // Join with purchase_orders (conditionally?) - SQLite joins are simple.
            // We'll fetch basic info and maybe expand in controller or separate calls if needed.
            // For dashboard, we often need 'Project Name', 'Entity Name/Number'.

            // Complex join approach or simple? Let's do a join assuming PO for now.
            // Actually, let's keep it generic and fetch metadata separately or via specific queries?
            // "Entity Type" 'purchase_order' -> we can join on purchase_orders.
            // If we have Expenses later, we'd need UNION or separate handling.
            // Given simpler scope, let's try a dynamic select or just get everything and enrich on frontend?
            // No, backend enrichment is better.

            /* 
               Since we only have purchase_order support right now, I'll hardcode a Left Join for PO context.
               If expense comes, I'll add another join.
            */
            const items = await getAll(`
                SELECT 
                    a.*,
                    u.name as requester_name,
                    po.po_number,
                    po.project_id,
                    p.name as project_name
                FROM approvals a
                LEFT JOIN users u ON a.requester_id = u.id
                LEFT JOIN purchase_orders po ON a.entity_type = 'purchase_order' AND a.entity_id = po.id
                LEFT JOIN projects p ON po.project_id = p.id
                WHERE a.status = 'pending'
                ORDER BY a.request_date DESC
            `);
            return items;
        } catch (error) {
            throw error;
        }
    },

    // Process approval/rejection
    process: async (id, status, userId, comments) => {
        try {
            await runQuery(
                `UPDATE approvals 
                 SET status = ?, actioned_by = ?, action_date = CURRENT_TIMESTAMP, comments = ? 
                 WHERE id = ?`,
                [status, userId, comments, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Find by entity
    findByEntity: async (type, id) => {
        try {
            const items = await getAll(
                'SELECT * FROM approvals WHERE entity_type = ? AND entity_id = ? ORDER BY request_date DESC',
                [type, id]
            );
            return items;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Approval;
