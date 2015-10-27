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
	listenAddress: "127.0.0.1",
	persistentConfigDir: "/usr/etc/",
	lpcApiAddress: { addr: "127.0.0.1", port: 8080 }
    };

    fs.readFile(path, { encoding: "utf8" }, function (err, data) {
	if (!err) {
	    _.merge(conf, JSON.parse(data));
	}
	defer.resolve(conf);
    });

    return defer.promise;
};
