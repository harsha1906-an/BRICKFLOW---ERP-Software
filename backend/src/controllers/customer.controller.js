const Customer = require('../models/customer.model');
const AuditService = require('../services/auditService');

// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer' });
    }
};

// Create customer
const createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name and phone are required'
            });
        }

        const customerId = await Customer.create({ name, phone, email, address });

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: { id: customerId }
        });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ success: false, message: 'Failed to create customer' });
    }
};

// Update customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name and phone are required'
            });
        }

        const oldCustomer = await Customer.findById(id);

        await Customer.update(id, { name, phone, email, address });

        // Audit Log
        if (oldCustomer) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'UPDATE', 'customers', id,
                oldCustomer, { name, phone, email, address },
                req
            );
        }

        res.json({ success: true, message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ success: false, message: 'Failed to update customer' });
    }
};

// Delete customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await Customer.delete(id);

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        if (error.message === 'Cannot delete customer with existing bookings') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to delete customer' });
    }
};

// Add visit
const addVisit = async (req, res) => {
    try {
        const id = await Customer.addVisit(req.body);
        res.status(201).json({ success: true, data: { id, ...req.body } });
    } catch (error) {
        console.error('Add visit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Record lost customer
const recordLost = async (req, res) => {
    try {
        const { id } = req.body; // Assuming id is in body based on recordLost implementation
        const oldCustomer = await Customer.findById(id);

        await Customer.recordLost(req.body);

        // Audit Log
        if (oldCustomer) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'RECORD_LOST', 'customers', id,
                { status: oldCustomer.status }, { status: 'lost', ...req.body },
                req
            );
        }

        res.json({ success: true, message: 'Customer marked as lost' });
    } catch (error) {
        console.error('Record lost error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get analytics dashboard data
const getAnalytics = async (req, res) => {
    try {
        const data = await Customer.getAnalytics();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update status
const updateStatus = async (req, res) => {
    try {
        const oldCustomer = await Customer.findById(req.params.id);

        await Customer.update(req.params.id, req.body);

        // Audit Log
        if (oldCustomer) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'STATUS_CHANGE', 'customers', req.params.id,
                { status: oldCustomer.status }, req.body,
                req
            );
        }
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addVisit,
    recordLost,
    getAnalytics,
    updateStatus
};
