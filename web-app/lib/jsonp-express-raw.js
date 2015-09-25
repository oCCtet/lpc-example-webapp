// Express middleware - Raw JSONP response without JSON
// parsing or stringifying. Inspired by express.jsonp()
// and jsonp-express node module.
//
// Copyright (C) 2015 Teleste Corporation

"use strict";

exports = module.exports = function (req, res, next) {
    var callback = req.query.callback;

    // content-type
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Type", "application/json");

    // fixup callback
    if (Array.isArray(callback)) {
	callback = callback[0];
    }

    res.jsonp = function (json) {
	var body = json;

	// jsonp
	if (typeof callback === "string" && callback.length !== 0) {
	    res.set("Content-Type", "text/javascript");

	    // restrict callback charset
	    callback = callback.replace(/[^\[\]\w$.]/g, '');

	    // replace chars not allowed in JavaScript that are in JSON
	    body = String(body)
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');

	    // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
	    // the typeof check is just to reduce client error noise
	    body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';
	} else {
	    body = JSON.stringify(body);
	}

	return res.send(body);
    };

    next();
};
