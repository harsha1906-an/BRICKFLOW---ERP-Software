const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();
const chartDataController = require('@/controllers/appControllers/chartDataController');

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

const routerApp = (entity, controller) => {
  router.route(`/${entity}/create`).post(catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'payment' || entity === 'invoice') {
    router.route(`/${entity}/approve/:id`).post(catchErrors(controller['approveUpdate']));
    router.route(`/${entity}/reject/:id`).post(catchErrors(controller['rejectUpdate']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }

  if (entity === 'lead') {
    router.route(`/${entity}/convert/:id`).post(catchErrors(controller['convert']));
  }

  if (entity === 'material') {
    router.route(`/${entity}/adjust/:id`).post(catchErrors(controller['adjustStock']));
    router.route(`/${entity}/history/:id`).get(catchErrors(controller['history']));
    router.route(`/${entity}/transactions`).get(catchErrors(controller['recentTransactions']));
    router.route(`/${entity}/downloadReport`).get(catchErrors(controller['downloadReport']));
  }

  if (entity === 'client') {
    router.route(`/${entity}/report`).get(catchErrors(controller['report']));
  }

  if (entity === 'purchaseorder') {
    router.route(`/${entity}/submit/:id`).patch(catchErrors(controller['submit']));
    router.route(`/${entity}/approve/:id`).patch(catchErrors(controller['approve']));
    router.route(`/${entity}/reject/:id`).patch(catchErrors(controller['reject']));
  }

  if (entity === 'booking') {
    router.route(`/${entity}/receipt/:id`).get(catchErrors(controller['receipt']));
  }

  if (entity === 'pettycashtransaction') {
    router.route(`/${entity}/report`).get(catchErrors(controller['report']));
  }
};

router.route('/dashboard/chart-data').get(catchErrors(chartDataController));

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;
