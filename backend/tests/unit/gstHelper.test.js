const { calculateGST, calculateGSTFromTotal } = require('../../src/utils/gstHelper');

describe('GST Helper Functions', () => {
    describe('calculateGST', () => {
        test('should calculate 18% GST correctly', () => {
            const result = calculateGST(100, 18);
            expect(result).toEqual({
                base_amount: 100,
                gst_amount: 18,
                total_amount: 118,
                gst_percentage: 18
            });
        });

        test('should calculate 5% GST correctly', () => {
            const result = calculateGST(1000, 5);
            expect(result.gst_amount).toBe(50);
            expect(result.total_amount).toBe(1050);
        });

        test('should handle floating point inputs', () => {
            const result = calculateGST(123.45, 18);
            expect(result.base_amount).toBe(123.45);
            // 123.45 * 0.18 = 22.221
            expect(result.gst_amount).toBeCloseTo(22.22, 2);
            expect(result.total_amount).toBeCloseTo(145.67, 2);
        });
    });

    describe('calculateGSTFromTotal', () => {
        test('should reverse calculate 18% GST from total 118', () => {
            const result = calculateGSTFromTotal(118, 18);
            expect(result.base_amount).toBeCloseTo(100, 2);
            expect(result.gst_amount).toBeCloseTo(18, 2);
            expect(result.total_amount).toBe(118);
        });

        test('should reverse calculate 18% GST from total 100', () => {
            // 100 / 1.18 = 84.7457...
            const result = calculateGSTFromTotal(100, 18);
            expect(result.base_amount).toBeCloseTo(84.75, 2);
            expect(result.gst_amount).toBeCloseTo(15.25, 2);
            expect(result.total_amount).toBe(100);
        });
    });
});
