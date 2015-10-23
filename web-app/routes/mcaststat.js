// Routes for multicast receiver statistics.
//
// An external multicast receiver/monitor program at 'mcrecv:6700' is
// expected to provide statictics via /mcast/stats HTTP API, responding
// a properly formatted JSON content; this route simply responds with
// that content.
//
// The address for host 'mcrecv' should be configured in the /etc/hosts
// file for the example to work; the configuration may be done via Docker,
// or even statically to be the localhost (127.0.0.1) if the service shall
// reside on the same host.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

var httpRequest = require("../lib/httprequest");
var Q = require("q");
var express = require("express");
var router = express.Router();

router.all(function (req, res, next) {
    if (!req.accepts("application/json"))
	return res.status(406).send("Must accept application/json");
    next();
});

function readStatistics () {
    var defer = Q.defer();
    var options = {
	hostname: "mcrecv",
	port: 6700,
	path: "/mcast/stats",
	method: "GET"
    };

    httpRequest(options, function (err, res) {
	if (err) {
	    defer.reject(new Error("Failed to read multicast receive statictics: " + err.message));
	} else {
	    defer.resolve(res);
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
