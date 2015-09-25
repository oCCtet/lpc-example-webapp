// Routes for (user-defined) properties.
//
// The properties (key-value pairs) are maintained as an array of
// objects, accessed and modified via RESTful API as per [rest-api].
//
//  [rest-api]: https://en.wikipedia.org/wiki/Representational_state_transfer#Applied_to_web_services
//
// Copyright (C) 2015 Teleste Corporation

/* globals app: false */

"use strict";

var express = require("express");
var parser = require("body-parser");
var router = express.Router();

router.use(parser.json());

router.param("id", function (req, res, next, id) {
    req.id = parseInt(id);
    next();
});

router.all(function (req, res, next) {
    if (!req.accepts("application/json"))
	return res.status(406).send("ERROR: Must accept application/json");
    next();
});

router.route("/")
    .get(function (req, res) {
	app.properties.list()
	    .then(function (data) {
		res.json(data);
	    })
	    .fail(function (err) {
		res.status(500).json({ id: -1, error: "Internal error", details: err.message });
	    })
	    .done();
    })
    .put(function (req, res) {
	app.properties.replace(req.body)
	    .then(function (data) {
		res.json(data);
	    })
	    .fail(function (err) {
		res.status(500).json({ id: -1, error: "Internal error", details: err.message });
	    })
	    .done();
    })
    .post(function (req, res) {
	app.properties.create(req.body)
	    .then(function (data) {
		res.json(data);
	    })
	    .fail(function (err) {
		res.status(500).json({ id: -1, error: "Internal error", details: err.message });
	    })
	    .done();
    })
    .delete(function (req, res) {
	app.properties.clear()
	    .then(function () {
		res.end();
	    })
	    .fail(function (err) {
		res.status(500).json({ id: -1, error: "Internal error", details: err.message });
	    })
	    .done();
    });

router.route("/:id")
    .get(function (req, res) {
	app.properties.retrieve(req.id)
	    .then(function (data) {
		res.json(data);
	    })
	    .fail(function (err) {
		res.status(404).json({ id: req.id, error: "Not found", details: err.message });
	    })
	    .done();
    })
    .put(function (req, res) {
	app.properties.update(req.id, req.body)
	    .then(function (data) {
		res.json(data);
	    })
	    .fail(function (err) {
		res.status(500).json({ id: req.id, error: "Internal error", details: err.message });
	    })
	    .done();
    })
    .delete(function (req, res) {
	app.properties.erase(req.id)
	    .then(function () {
		res.end();
	    })
	    .fail(function (err) {
		res.status(404).json({ id: req.id, error: "Not found", details: err.message });
	    })
	    .done();
    });

router.use(function (err, req, res, next) {  // jshint ignore: line
    res.status(500).json({ id: -1, error: "Internal error", details: err.stack });
});

module.exports = router;
