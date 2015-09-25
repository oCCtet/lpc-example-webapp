// Routes for multicast receiver statistics.
//
// An external receiver/monitor program is expected to update the
// statFile with properly formatted JSON content; this route simply
// responds with that content.
//
// Copyright (C) 2015 Teleste Corporation

/* globals app: false */

"use strict";

var fs = require("fs");
var Q = require("q");
var express = require("express");
var parser = require("body-parser");
var router = express.Router();

var filename = "mcastrecv.stat";

router.use(parser.json());

router.all(function (req, res, next) {
    if (!req.accepts("application/json"))
	return res.status(406).send("ERROR: Must accept application/json");
    next();
});

function readStatistics () {
    var defer = Q.defer();
    var statFile = app.config.runtimeVariableDir + filename;

    fs.readFile(statFile, { encoding: "utf8" }, function (err, data) {
	if (err) {
	    defer.reject(new Error("Failed to read multicast receive statictics: " + err.message));
	} else {
	    defer.resolve(JSON.parse(data));
	}
    });

    return defer.promise;
}

router.get("/", function (req, res) {
    readStatistics()
	.then(function (data) {
	    res.json(data);
	})
	.fail(function (err) {
	    res.status(500).json({ id: -1, error: "Internal error", details: err.message });
	})
	.done();
});

router.use(function (err, req, res, next) {  // jshint ignore: line
    res.status(500).json({ id: req.id, error: "Internal error", details: err.stack });
});

module.exports = router;
