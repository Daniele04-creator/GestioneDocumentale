'use strict';

var path = require('path');
var http = require('http');
var cors = require('cors');

var oas3Tools = require('oas3-tools');
var serverPort = Number(process.env.PORT || 3000);
var corsMiddleware = cors({
    // Permissive CORS is intentional for the local demo/prototype.
    origin: '*',
    methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    optionsSuccessStatus: 204
});

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
    openApiValidator: {
        validateRequests: false,
        validateResponses: false
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();

// Initialize the Swagger middleware
http.createServer(function (req, res) {
    // Needed when Swagger Editor calls the local server during the demo.
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    corsMiddleware(req, res, function () {
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }

        app(req, res);
    });
}).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});
