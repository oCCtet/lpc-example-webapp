// Routes for operating system basic monitoring information.
//
// All information except temperature sensor readings are fetched
// via the node.js's built-in os module; sensors are read via the
// /sensors API provided by the LPC module's DeviceInfo agent.
//
// Copyright (C) 2015 Teleste Corporation

/* globals app: false */

"use strict";

var httpRequest = require("../lib/httprequest");
var os = require("os");
var _ = require("lodash");
var Q = require("q");
var express = require("express");
var parser = require("body-parser");
var router = express.Router();

router.use(parser.json());

router.all(function (req, res, next) {
    if (!req.accepts("application/json"))
	return res.status(406).send("ERROR: Must accept application/json");
    next();
});

function getOsInfo () {
    return Q.fcall(function () {
	return [{
            id: 0,
	    hostname: os.hostname(),
	    type: os.type(),
	    platform: os.platform(),
	    arch: os.arch(),
	    release: os.release()
	}];
    });
}

function getOsStats () {
    var defer = Q.defer();
    var result = [{
	id: 0,
	totalmem: os.totalmem(),
	freemem: os.freemem(),
	loadavg: os.loadavg(),
	temperatures: [ 0.0, 0.0 ]
    }];
    var options = {
	hostname: app.config.lpcApiAddress.addr,
	port: app.config.lpcApiAddress.port,
	path: "/sensors/temperature",
	method: "GET"
    };

    httpRequest(options, function (err, res) {
	if (err) {
	    defer.resolve(result);
	} else {
	    defer.resolve(_.merge(result[0], { temperatures: _.pluck(res, "value") }));
	}
    });

    return defer.promise;
}

function getCpuInfo () {
    return Q.fcall(function () {
	return _.map(os.cpus(), function (item, index) {
	    return _.merge({ id: index }, item);
	});
    });
}

router.get("/", function (req, res) {
    getOsInfo().then(function (osinfo) {
	getOsStats().then(function (osstats) {
	    getCpuInfo().then(function (cpuinfo) {
		res.json({ os: osinfo,
			   stats: osstats,
			   cpu: cpuinfo
			 });
	    }).done();
	}).done();
    }).done();
});

router.get("/os", function (req, res) {
    getOsInfo().then(function (result) {
	res.json(result);
    }).done();
});

router.get("/stats", function (req, res) {
    getOsStats().then(function (result) {
	res.json(result);
    }).done();
});

router.get("/cpu", function (req, res) {
    getCpuInfo().then(function (result) {
	res.json(result);
    }).done();
});

router.use(function (err, req, res, next) {  // jshint ignore: line
    res.status(500).json({ id: req.id, error: "Internal error", details: err.stack });
});

module.exports = router;
