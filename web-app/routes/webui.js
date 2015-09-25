// Routes for JSONP / Web User Interface.
//
// While the other static files are served by the express.static(),
// the JSONP files must be served in a special way: the request URL
// containing something like '/example-app/CUSTOM?callback=funcname'
// causes a file with name '<appdir>/public/example-app/CUSTOM.jsonp'
// to be read, and responded through the jsonp-express-raw middleware.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

var jsonp = require("../lib/jsonp-express-raw");
var fs = require("fs");
var express = require("express");
var router = express.Router();

router.use(jsonp);

router.route("/:id")
    .get(function (req, res) {
        var pathName = __dirname + "/../public" + req.baseUrl + req.path + ".jsonp";
        fs.readFile(pathName, { encoding: "utf8" }, function (err, data) {
            if (err) {
                res.status(404).jsonp({ id: req.id, error: "Not found", details: err });
            } else {
                res.jsonp(data);
            }
        });
    });

router.use(function (err, req, res, next) {  // jshint ignore: line
    res.status(500).jsonp({ id: req.id, error: "Internal error", details: err.stack });
});

module.exports = router;
