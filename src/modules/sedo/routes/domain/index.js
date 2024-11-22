const DomainController = require("../../controllers/DomainController");

// Third Party Imports
const route = require("express").Router();

const domainController = new DomainController();

// @route     /api/sedo/addDomain
// @desc      Insert domain
route.post("/add", async (req, res) => {
    await domainController.insertDomainIntoSedo(req, res);
});

module.exports = route;