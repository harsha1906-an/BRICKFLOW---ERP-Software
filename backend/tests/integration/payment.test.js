const request = require('supertest');
const app = require('../../src/server');
const { validateEnvironment } = require('../../src/utils/envValidator');

// Mock auth middleware for integration tests
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
    req.user = { id: 1, role: 'admin', username: 'test_admin' };
    next();
});

// Mock notification service
jest.mock('../../src/services/notificationService', () => ({
    notifyPaymentReceived: jest.fn().mockResolvedValue(true)
}));

// Mock database operations
const dbUtil = require('../../src/config/db');
// We don't want to run actual DB queries that modify state if possible,
// but for integration tests, using a test DB or mocking the models is common.
// Given time constraints, valid payload validation is our primary goal here.

describe('Payment API Integration', () => {

    // Ensure env is valid
    beforeAll(() => {
        process.env.JWT_SECRET = 'test_secret_for_integration_testing_only';
    });

    describe('POST /api/payments', () => {
        test('should reject invalid amount', async () => {
            const response = await request(app)
                .post('/api/payments')
                .send({
                    booking_id: 1,
                    payment_date: '2024-01-29',
                    amount: -500, // Invalid
                    payment_method: 'cash'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Validation failed');
        });

        test('should reject missing required fields', async () => {
            const response = await request(app)
                .post('/api/payments')
                .send({
                    // Missing booking_id and amount
                    payment_date: '2024-01-29',
                    payment_method: 'cash'
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        test('should validate GST fields', async () => {
            const response = await request(app)
                .post('/api/payments')
                .send({
                    booking_id: 1,
                    payment_date: '2024-01-29',
                    amount: 1000,
                    payment_method: 'cash',
                    has_gst: true,
                    gst_percentage: 99 // Invalid percentage
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'gst_percentage',
                        message: expect.stringContaining('must be one of')
                    })
                ])
            );
        });
    });
});
