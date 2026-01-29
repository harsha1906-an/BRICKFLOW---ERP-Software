const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ERP System API',
            version: '1.0.0',
            description: 'API documentation for the Construction ERP System',
            contact: {
                name: 'Support Team',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development Server',
            },
            {
                url: 'https://erp.yourdomain.com/api',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'], // Files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = specs;
