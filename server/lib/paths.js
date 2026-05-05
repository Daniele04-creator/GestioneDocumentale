'use strict';

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const STORAGE_ROOT = path.join(PROJECT_ROOT, 'storage', 'documents');

module.exports = {
  PROJECT_ROOT,
  STORAGE_ROOT,
};
