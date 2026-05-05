'use strict';

var fs = require('fs');
var utils = require('../utils/writer.js');
var ProjectDocuments = require('../service/ProjectDocumentsService');

module.exports.projectDocumentsController_archiveProjectDocument = function projectDocumentsController_archiveProjectDocument (req, res, next, projectId, documentId) {
  ProjectDocuments.projectDocumentsController_archiveProjectDocument(documentId, projectId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.projectDocumentsController_downloadProjectDocumentFile = function projectDocumentsController_downloadProjectDocumentFile (req, res, next, projectId, documentId) {
  ProjectDocuments.projectDocumentsController_downloadProjectDocumentFile(documentId, projectId)
    .then(function (file) {
      res.writeHead(200, {
        'Content-Type': file.mimeType,
        'Content-Disposition': 'attachment; filename="' + file.fileName + '"'
      });
      fs.createReadStream(file.absolutePath).pipe(res);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.projectDocumentsController_getProjectDocumentById = function projectDocumentsController_getProjectDocumentById (req, res, next, projectId, documentId) {
  ProjectDocuments.projectDocumentsController_getProjectDocumentById(documentId, projectId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.projectDocumentsController_listProjectDocuments = function projectDocumentsController_listProjectDocuments (req, res, next, search, status, tag, ownerId, taskId, packageId, projectId) {
  ProjectDocuments.projectDocumentsController_listProjectDocuments(projectId, search, status, tag, ownerId, taskId, packageId, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.projectDocumentsController_updateProjectDocument = function projectDocumentsController_updateProjectDocument (req, res, next, body, projectId, documentId) {
  ProjectDocuments.projectDocumentsController_updateProjectDocument(body, documentId, projectId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.ProjectDocumentsController_archiveProjectDocument =
  module.exports.projectDocumentsController_archiveProjectDocument;
module.exports.ProjectDocumentsController_downloadProjectDocumentFile =
  module.exports.projectDocumentsController_downloadProjectDocumentFile;
module.exports.ProjectDocumentsController_getProjectDocumentById =
  module.exports.projectDocumentsController_getProjectDocumentById;
module.exports.ProjectDocumentsController_listProjectDocuments =
  module.exports.projectDocumentsController_listProjectDocuments;
module.exports.ProjectDocumentsController_updateProjectDocument =
  module.exports.projectDocumentsController_updateProjectDocument;
