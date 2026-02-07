const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('PettyCashTransaction');

const summary = require('./summary');
const report = require('./report');

methods.summary = summary;
methods.report = report;

module.exports = methods;
