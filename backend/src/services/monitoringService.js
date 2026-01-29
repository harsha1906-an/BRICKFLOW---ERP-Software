const os = require('os');
const { getOne } = require('../config/db');

/**
 * Get system metrics
 */
const getSystemMetrics = async () => {
    return {
        memory: {
            total: os.totalmem(),
            free: os.freemem(),
            usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%'
        },
        uptime: process.uptime(),
        loadAvg: os.loadavg(),
        cpus: os.cpus().length,
        platform: os.platform()
    };
};

/**
 * Get business metrics (count of key entities)
 */
const getBusinessMetrics = async () => {
    try {
        const projects = await getOne('SELECT COUNT(*) as count FROM projects');
        const unitsSold = await getOne('SELECT COUNT(*) as count FROM units WHERE status="sold"');
        const users = await getOne('SELECT COUNT(*) as count FROM users');

        return {
            projects: projects ? projects.count : 0,
            unitsSold: unitsSold ? unitsSold.count : 0,
            users: users ? users.count : 0
        };
    } catch (error) {
        console.error('Error fetching business metrics:', error);
        return {
            projects: -1,
            unitsSold: -1,
            users: -1
        };
    }
};

/**
 * Get full dashboard stats
 */
const getDashboardStats = async () => {
    const system = await getSystemMetrics();
    const business = await getBusinessMetrics();

    return {
        timestamp: new Date().toISOString(),
        system,
        business
    };
};

module.exports = {
    getDashboardStats
};
