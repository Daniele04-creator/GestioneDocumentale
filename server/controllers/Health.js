'use strict';

var utils = require('../utils/writer.js');
var Health = require('../service/HealthService');

module.exports.healthController_getHealth = function healthController_getHealth (req, res, next) {
  Health.healthController_getHealth()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.HealthController_getHealth = module.exports.healthController_getHealth;
