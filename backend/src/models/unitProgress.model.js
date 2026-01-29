const { getAll, getOne, runQuery } = require('../config/db');
const ConstructionStage = require('./constructionStage.model');

// Allowed status transitions
const ALLOWED_TRANSITIONS = {
    'NOT_STARTED': ['IN_PROGRESS', 'COMPLETED'],
    'IN_PROGRESS': ['COMPLETED'],
    'COMPLETED': [] // IMMUTABLE
};

const UnitProgress = {
    // Initialize progress entries for all stages when a unit is created
    initializeUnitProgress: async (unitId) => {
        try {
            const stages = await ConstructionStage.findAll();

            for (const stage of stages) {
                await runQuery(`
                    INSERT OR IGNORE INTO unit_progress (unit_id, stage_id, status)
                    VALUES (?, ?, 'NOT_STARTED')
                `, [unitId, stage.id]);
            }

            return { success: true, message: `Initialized ${stages.length} stages for unit ${unitId}` };
        } catch (error) {
            throw error;
        }
    },

    // Get progress for a specific unit
    getUnitProgress: async (unitId) => {
        try {
            const progress = await getAll(`
                SELECT 
                    up.id,
                    up.unit_id,
                    up.stage_id,
                    cs.name as stage_name,
                    cs.default_percentage,
                    cs.stage_order as sequence_order,
                    up.status,
                    up.completion_date,
                    up.updated_by,
                    u.username as updated_by_name,
                    up.remarks,
                    up.updated_at
                FROM unit_progress up
                JOIN construction_stages cs ON up.stage_id = cs.id
                LEFT JOIN users u ON up.verified_by = u.id
                WHERE up.unit_id = ?
                ORDER BY cs.stage_order ASC
            `, [unitId]);

            // Calculate overall percentage
            const completedPercentage = progress
                .filter(p => p.status === 'COMPLETED')
                .reduce((sum, p) => sum + p.default_percentage, 0);

            return {
                unit_id: unitId,
                stages: progress,
                overall_percentage: completedPercentage,
                total_stages: progress.length,
                completed_stages: progress.filter(p => p.status === 'COMPLETED').length,
                in_progress_stages: progress.filter(p => p.status === 'IN_PROGRESS').length
            };
        } catch (error) {
            throw error;
        }
    },

    // Get progress for all units in a project
    getProjectProgress: async (projectId) => {
        try {
            const progress = await getAll(`
                SELECT 
                    u.id as unit_id,
                    u.unit_number,
                    u.status as unit_status,
                    COALESCE(SUM(CASE WHEN up.status = 'COMPLETED' THEN cs.default_percentage ELSE 0 END), 0) as progress_percentage,
                    COUNT(DISTINCT cs.id) as total_stages,
                    COUNT(DISTINCT CASE WHEN up.status = 'COMPLETED' THEN up.id END) as completed_stages,
                    COUNT(DISTINCT CASE WHEN up.status = 'IN_PROGRESS' THEN up.id END) as in_progress_stages
                FROM units u
                LEFT JOIN unit_progress up ON u.id = up.unit_id
                LEFT JOIN construction_stages cs ON up.stage_id = cs.id
                WHERE u.project_id = ?
                GROUP BY u.id, u.unit_number, u.status
                ORDER BY u.unit_number ASC
            `, [projectId]);

            // Calculate average project progress
            const avgProgress = progress.length > 0
                ? progress.reduce((sum, p) => sum + p.progress_percentage, 0) / progress.length
                : 0;

            return {
                project_id: projectId,
                units: progress,
                average_progress: Math.round(avgProgress * 100) / 100,
                total_units: progress.length
            };
        } catch (error) {
            throw error;
        }
    },

    // Update progress status with validation and immutability enforcement
    updateStatus: async (unitId, stageId, newStatus, userId, remarks = null) => {
        try {
            // Get current status
            const current = await getOne(
                'SELECT status FROM unit_progress WHERE unit_id = ? AND stage_id = ?',
                [unitId, stageId]
            );

            if (!current) {
                throw new Error('Progress entry not found for this unit and stage');
            }

            // Check if already completed (IMMUTABLE)
            if (current.status === 'COMPLETED') {
                throw new Error('Cannot modify completed stage - completion is immutable');
            }

            // Validate transition
            if (!ALLOWED_TRANSITIONS[current.status].includes(newStatus)) {
                throw new Error(`Invalid status transition: ${current.status} → ${newStatus}`);
            }

            // Build update query based on new status
            let updateQuery = 'UPDATE unit_progress SET status = ?, updated_at = CURRENT_TIMESTAMP';
            const params = [newStatus];

            if (newStatus === 'IN_PROGRESS') {
                // started_on not in DB, skipping
            }

            if (newStatus === 'COMPLETED') {
                updateQuery += ', completion_date = CURRENT_DATE, updated_by = ?'; // updated_by matches DB column
                params.push(userId);
            }

            if (remarks) {
                updateQuery += ', remarks = ?';
                params.push(remarks);
            }

            updateQuery += ' WHERE unit_id = ? AND stage_id = ?';
            params.push(unitId, stageId);

            await runQuery(updateQuery, params);

            return {
                success: true,
                old_status: current.status,
                new_status: newStatus,
                message: `Stage updated from ${current.status} to ${newStatus}`
            };
        } catch (error) {
            throw error;
        }
    },

    // Get specific progress entry
    findByUnitAndStage: async (unitId, stageId) => {
        try {
            const entry = await getOne(
                'SELECT * FROM unit_progress WHERE unit_id = ? AND stage_id = ?',
                [unitId, stageId]
            );
            return entry;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = UnitProgress;
