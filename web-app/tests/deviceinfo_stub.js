// DeviceInfo stub, providing test responses for the
// web-app requests.
//
// Copyright (C) 2015 Teleste Corporation

var fs = require("fs");
var express = require("express");
var app = express();

// Set to 'true' to make the stub report errors
// for requests.
var reportError = false;

app.get("/sensors/temperature", function (req, res) {
    if (reportError === true) {
	res.status(500).json({ id: -1, error: "Internal error", details: "reportError === true" });
    } else {
	res.json([
	    {
		"id": 0,
		"type": "board",
		"value": 37.4
	    },
	    {
		"id": 1,
		"type": "cpu",
		"value": 62.1
	    }
	]);
    }
});

app.post("/input/streaming", function (req, res) {
    if (reportError === true) {
	res.status(500).json({ id: -1, error: "Internal error", details: "reportError === true" });
    } else {
	var input = JSON.parse(req.body);
	if (input.addr === undefined || input.vlan === undefined) {
	    res.status(400).json({ id: -1, error: "Bad request", details: "request body must contain 'addr' and 'vlan' tokens" });
	} else {
	    // client ignores the success response, so we
	    // simply send an empty object
	    res.json({});
	}
    }
});

app.delete("/input/streaming", function (req, res) {
    if (reportError === true) {
	res.status(500).json({ id: -1, error: "Internal error", details: "reportError === true" });
    } else {
	res.end();
    }
});

app.delete("/input/streaming/:id", function (req, res) {
    if (reportError === true) {
	res.status(500).json({ id: -1, error: "Internal error", details: "reportError === true" });
    } else if (parseInt(req.params.id) !== 99999) {
	res.status(400).json({ id: -1, error: "Bad request", details: "id must be the special token '99999'" });
    } else if (req.query.addr === undefined || req.query.vlan === undefined) {
	res.status(400).json({ id: -1, error: "Bad request", details: "query string must contain 'addr' and 'vlan' tokens" });
    } else {
	res.end();
    }
});

fs.readFile(__dirname + "/../config/devel.conf", { encoding: "utf8" }, function (err, data) {
    if (err) {
	console.error("Failed to read options:", err.message);
    } else {
	var options = JSON.parse(data);
	var server = app.listen(options.lpcApiAddress.port, options.lpcApiAddress.addr, function () {
	    console.log("Listening on %s:%s", server.address().address, server.address().port);
	});
	server.on("error", function (err) {
	    console.error("DeviceInfo stub failure:", err);
	    process.exit(1);
	});
    }
});
