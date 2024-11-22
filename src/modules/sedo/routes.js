const express = require('express');
const domainRoutes = require('./routes/domain');

const router = express.Router();

router.use('/domain', domainRoutes);


module.exports = router;