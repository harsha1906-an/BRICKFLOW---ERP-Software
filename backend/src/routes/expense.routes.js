const express = require('express');
const router = express.Router();
const {
    getAllExpenses,
    getExpenseById,
    createExpense,
    correctExpense,
    getExpenseSummary,
    getTotalByProject
} = require('../controllers/expense.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Summary routes
router.get('/summary', getExpenseSummary);
router.get('/totals', getTotalByProject);

// CRUD routes
router.get('/', getAllExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.post('/:id/correct', correctExpense);

module.exports = router;
