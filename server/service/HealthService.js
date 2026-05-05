'use strict';

/**
 * Health check
 * Verifica che il backend sia avviato.
 *
 * returns inline_response_200
 **/
exports.healthController_getHealth = function() {
  return Promise.resolve({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};
