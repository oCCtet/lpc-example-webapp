// Custom web app, demonstrating how UI integration with the
// Luminato WebUI can be done.
//
// At the minimum, the static application, model and layout files
// (app.json, index.json and index.xml) from directory ./public must
// be served. If the model requires a script via the 'ctor' directive,
// that must be served through raw JSONP processing. In this example
// this is done via express.static() and the 'webui' route below.
//
// Other models and routes make up the rest of the example application,
// serving requests from the example webui application.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

var webui = require("../routes/webui");
var monitor = require("../routes/monitor");
var mcaststat = require("../routes/mcaststat");
var properties = require("../routes/properties");
var internaljoin = require("../routes/internaljoin");
var loadConfig = require("../models/config");
var loadProperties = require("../models/properties");
var loadInternalJoin = require("../models/internaljoin");
var Q = require("q");
var express = require("express");
var app = express();

GLOBAL.app = app;

function publishConfig (config) {
    return Q.fcall(function () {
        app.config = config;
        return app;
    });
}

function publishProperties (props) {
    return Q.fcall(function () {
        app.properties = props;
        return app;
    });
}

function publishInternalJoin (ij) {
    return Q.fcall(function () {
        app.internaljoin = ij;
        return app;
    });
}

function addRoutes () {
    return Q.fcall(function () {
	app.use(express.static(__dirname + "/../public"));
	app.use("/example-app", webui);
	app.use("/monitor", monitor);
	app.use("/mcaststat", mcaststat);
	app.use("/properties", properties);
	app.use("/internaljoin", internaljoin);
        return app;
    });
}

loadConfig(process.argv[2])
    .then(publishConfig)
    .then(loadProperties)
    .then(publishProperties)
    .then(loadInternalJoin)
    .then(publishInternalJoin)
    .then(addRoutes)
    .then(function () {
	var server = app.listen(app.config.listenPort, app.config.listenAddress, function () {
	    console.log("Listening on %s:%s", server.address().address, server.address().port);
	});
	server.on("error", function (err) {
	    console.error("Server failure:", err.message);
	    process.exit(2);
	});
    })
    .fail(function (err) {
        console.error("Server startup failure:", err.message);
    })
    .done();

// Upstart 'reload' workaround, effectively suppressing it.
process.on("SIGHUP", function () {
    console.log("SIGHUP ignored");
});
