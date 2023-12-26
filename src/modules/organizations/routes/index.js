const route = require('express').Router();
const OrganizationController = require('../controllers/OrganizationController');

const organizationController = new OrganizationController();

route.post('/', organizationController.saveOrganization.bind(organizationController));

route.get(
  '/:organizationId',
  organizationController.fetchOrganization.bind(organizationController),
);

route.delete('/', organizationController.deleteOrganization.bind(organizationController));

module.exports = route;
