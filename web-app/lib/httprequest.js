// HTTP client request.
//
// Reports the HTTP request results by calling the callback method
// with (err, res) parameters. If the request fails, or the response
// status code indicates an error, the callback shall be called with
// an error object.
//
// The 'options' parameter is the http.request() options string or
// object:
//
//    var options = {
//      hostname: "localhost",
//      port: 80,
//      path: "/",
//      method: "GET"
//    };
//
// The optional data parameter is the request body that should be sent to
// the server along with the request.
//
// Both the request body and the response are JSONified.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

var http = require("http");
var _ = require("lodash");

function httpRequest (options, data, cb) {
    var callback = _.isUndefined(cb) ? data : cb;
    var result = "";
    var req = http.request(options, function (res) {
	res.setEncoding("utf8");
	res.on("data", function (chunk) {
	    result += chunk;
	});
	res.on("end", function () {
	    try {
		if (res.statusCode >= 400)
		    throw new Error("HTTP request failed with status " + res.statusCode);
		callback(null, _.isEmpty(result) ? {} : JSON.parse(result));
	    } catch (e) {
		callback(e);
	    }
	});
    });

    req.on("error", function (err) {
	callback(err);
    });

    if (!_.isUndefined(data) && !_.isUndefined(cb)) {
	req.setHeader("Content-Type", "application/json");
	req.write(JSON.stringify(data));
    }

    req.end();
}

module.exports = httpRequest;
