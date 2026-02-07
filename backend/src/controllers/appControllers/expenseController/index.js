const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const Expense = require('@/models/appModels/Expense');
const Labour = require('@/models/appModels/Labour');
const LabourContract = require('@/models/appModels/LabourContract');

const methods = createCRUDController('Expense');

// Custom list method with filtering support
methods.list = async (req, res) => {
    try {
        const { page = 1, items = 10, startDate, endDate, recipientType, villa, labourSkill, supplier } = req.query;
        // Use companyID from admin if available, otherwise don't filter by it (matches generic behavior)
        const companyId = req.admin.companyId;

        let filter = {
            removed: false,
        };

        if (companyId) {
            filter.companyId = companyId;
        }

        // Date range filter
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Include full end date
            };
        }

        // Recipient type filter
        if (recipientType && recipientType !== 'all') {
            filter.recipientType = recipientType;
        }

        if (supplier) {
            filter.supplier = supplier;
        }

        // Labour-specific filters
        if (recipientType === 'Labour') {
            // Villa filter - now direct field on Expense
            if (villa) {
                filter.villa = villa;
            }

            // Labour skill filter
            if (labourSkill && labourSkill !== 'all') {
                const labourQuery = {
                    removed: false,
                    skill: labourSkill
                };
                if (companyId) {
                    labourQuery.companyId = companyId;
                }

                const labourWithSkill = await Labour.find(labourQuery).distinct('_id');

                if (labourWithSkill.length > 0) {
                    filter.labour = { $in: labourWithSkill };
                } else {
                    // No labour with this skill, return empty
                    return res.status(200).json({
                        success: true,
                        result: [],
                        pagination: {
                            page: parseInt(page),
                            pages: 0,
                            total: 0
                        }
                    });
                }
            }
        }

        const skip = (page - 1) * items;

        console.log('Final Filter Object:', JSON.stringify(filter, null, 2));

        const expenses = await Expense.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(items))
            .populate('supplier')
            .populate('labour');

        const total = await Expense.countDocuments(filter);

        console.log('Found expenses:', expenses.length);
        console.log('Total count:', total);

        return res.status(200).json({
            success: true,
            result: expenses,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / items),
                total
            }
        });
    } catch (error) {
        console.error('Error listing expenses:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching expenses',
            error: error.message
        });
    }
};

module.exports = methods;
