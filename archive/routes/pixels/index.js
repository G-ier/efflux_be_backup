// Third party imports
const route = require('express').Router();

route.get('/system1', (req, res, next) => {
  postbackCtrl.trackSystem1(req).then((response) => {
    res.send(response);
  }).catch((err) => {
    console.log('S1 Track Error', err)
    res.end();
  });
})

route.get('/sedo', (req, res, next) => {
  postbackCtrl.trackSedo(req).then((response) => {
    res.send(response);
  }).catch((err) => {
    console.log('SEDO Track Error', err)
    res.end();
  });
})

