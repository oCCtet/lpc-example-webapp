// Configuration options.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

var fs = require("fs");
var Q = require("q");
var _ = require("lodash");

module.exports = function (configPath) {
    var defer = Q.defer();
    var path = configPath || "/etc/lpc-example-app.conf";
    var conf = {
	listenPort: 8079,
	listenAddress: "",  // bind all interfaces
	persistentConfigDir: "/usr/etc/",
        runtimeVariableDir: "/var/run/",
	lpcApiAddress: { addr: "127.0.0.1", port: 8080 }
    };

    // A valid config file is REQUIRED.
    fs.readFile(path, { encoding: "utf8" }, function (err, data) {
	if (err) {
	    defer.reject(new Error("Failed to load configuration:", err.message));
	} else {
	    _.merge(conf, JSON.parse(data));
	    defer.resolve(conf);
	}
    });

    return defer.promise;
};
