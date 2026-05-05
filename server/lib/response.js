'use strict';

const writer = require('../utils/writer');
const { ApiError } = require('./apiError');

function toHttpError(error) {
  if (error instanceof ApiError) {
    return writer.respondWithCode(error.statusCode, error.toResponseBody());
  }

  console.error(error);
  return writer.respondWithCode(500, {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error.',
  });
}

module.exports = {
  toHttpError,
};
