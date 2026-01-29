const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth');
const { validateRequired } = require('../middleware/validators');

router.use(authMiddleware);

// Analytics Routes (Must be before :id to prevent conflict)
router.get('/analytics/dashboard', customerController.getAnalytics);
router.post('/visits', validateRequired(['customer_id', 'visit_date']), customerController.addVisit);
router.post('/lost', validateRequired(['customer_id', 'reason']), customerController.recordLost);
router.put('/status/:id', customerController.updateStatus);

// Basic CRUD
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', validateRequired(['name', 'phone']), customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
