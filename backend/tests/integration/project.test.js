const request = require('supertest');
const app = require('../../src/server');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
    req.user = { id: 1, role: 'admin', username: 'test_admin' };
    next();
});

describe('Project API Integration', () => {
    describe('GET /api/projects', () => {
        test('should return paginated results', async () => {
            const response = await request(app)
                .get('/api/projects?page=1&limit=10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.current_page).toBe(1);
            expect(response.body.pagination.items_per_page).toBe(10);
        });

        test('should handle default pagination', async () => {
            const response = await request(app)
                .get('/api/projects');

            expect(response.status).toBe(200);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.items_per_page).toBe(20); // Default limit
        });
    });
});
