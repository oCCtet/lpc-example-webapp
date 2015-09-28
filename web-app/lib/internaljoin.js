// Internal join library functions.
//
// Configures Luminato chassis switch using the /input/streaming
// API provided by the LPC module's DeviceInfo agent.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

var httpRequest = require("./httprequest");
var _ = require("lodash");

module.exports = function (lpcApiAddress) {
    var internaljoin = {
	options: {
	    hostname: lpcApiAddress.addr,
	    port: lpcApiAddress.port,
	    path: "/input/streaming"
	},
	add: function(item, cb) {
	    var opts = _.merge({}, this.options, { method: "POST" });
	    httpRequest(opts, { addr: item.addr, vlan: item.vlan }, function (err, res) {
		if (err)
		    cb(err);
		else
		    cb(null, res);
	    });
	},
	delete: function(item, cb) {
	    // The 'byquery' is a special id meaning that the query string parameters
	    // should be used instead to deduce what item to remove.
	    var opts = _.merge({}, this.options, {
		path: "/input/streaming/byquery?addr=" + item.addr + "&vlan=" + item.vlan,
		method: "DELETE"
	    });
	    httpRequest(opts, function (err, res) {
		if (err)
		    cb(err);
		else
		    cb(null, res);
	    });
	},
	clear: function(cb) {
	    var opts = _.merge({}, this.options, { method: "DELETE" });
	    httpRequest(opts, function (err, res) {
		if (err)
		    cb(err);
		else
		    cb(null, res);
	    });
	}
    };

    return internaljoin;
};
