// Custom (user-defined) properties data model maintains the
// properties as an array of objects, stored in a JSON-format
// file.
//
// Copyright (C) 2015 Teleste Corporation

/* globals app: false */

"use strict";

var fs = require("fs");
var Q = require("q");
var _ = require("lodash");

var filename = "custom-properties.conf";

function readProperties (obj) {
    var defer = Q.defer();
    var propertyConfigPath = app.config.persistentConfigDir + filename;

    try {
	fs.readFile(propertyConfigPath, { encoding: "utf8" }, function (err, data) {
	    if (!err) {
		obj.entries = JSON.parse(data);
	    }
	    defer.resolve(obj);
	});
    } catch (e) {
	defer.reject(new Error("Failed to read properties: " + e.message));
    }

    return defer.promise;
}

function writeProperties (data) {
    var defer = Q.defer();
    var propertyConfigPath = app.config.persistentConfigDir + filename;

    try {
	fs.writeFile(propertyConfigPath, JSON.stringify(data), function (err) {
	    if (err) {
		throw err;
	    } else {
		defer.resolve(data);
	    }
	});
    } catch (e) {
	defer.reject(new Error("Failed to write properties: " + e.message));
    }

    return defer.promise;
}

function injectTemplate (data) {
    return Q.fcall(function () {
	return [{
	    _template: true,
	    _type: "CustomProperty",
	    property_name: "",
	    property_value: ""
	}].concat(data);
    });
}

function injectType (data) {
    return Q.fcall(function () {
	return _.map(data, function (item) {
	    return _.merge({}, item, { _type: "CustomProperty" });
	});
    });
}

function findById (coll, id) {
    var item = _.findWhere(coll, { "id": id });
    if (item === undefined)
	throw new Error("No entry with ID " + id);
    return [ item ];
}

function promiseToFindById (coll, id) {
    return Q.fcall(function () {
	return findById(coll, id);
    });
}

function leftmost (data) {
    return Q.fcall(function () {
	return _.first(data);
    });
}

function replace (coll, input) {
    return Q.fcall(function () {
	coll.splice(0, coll.length);
	_.forEach(_.isArray(input) ? input : [ input ], function (value) {
	    coll.push(value);
	});
	return coll;
    });
}

function allocateNewEntry (coll, input) {
    return Q.fcall(function () {
	var newId = _.chain(coll)
	    .sortBy("id")
	    .reduce(function (candidate, item) {
		return candidate === item.id ? ++candidate : candidate;
	    }, 0)
	    .value();
	coll.push(_.merge({ id: newId }, input));
	return { id: newId, coll: coll };
    });
}

function updateOrCreate (coll, id, input) {
    return Q.fcall(function () {
	var item = _.findWhere(coll, { "id": id });
	if (item === undefined) {
	    coll.push(_.merge({ id: id }, input));
	} else {
	    _.merge(item, input);
	}
	return coll;
    });
}

function clear (coll) {
    return Q.fcall(function () {
	coll.splice(0, coll.length);
	return coll;
    });
}

function erase (coll, id) {
    return Q.fcall(function () {
	_.remove(coll, { "id": id });
	return coll;
    });
}

module.exports = function () {
    var properties = {
	entries: [],
	list: function () {
	    return injectType(this.entries)
		.then(injectTemplate);
	},
	retrieve: function (id) {
	    return promiseToFindById(this.entries, id)
		.then(injectType)
		.then(leftmost);
	},
	replace: function (input) {
	    return replace(this.entries, input)
		.then(writeProperties)
		.then(injectType);
	},
	create: function (input) {
	    return allocateNewEntry(this.entries, input)
		.then(function (obj) {
		    return writeProperties(obj.coll)
			.then(function (coll) {
			    return findById(coll, obj.id);
			});
		})
		.then(injectType)
		.then(leftmost);
	},
	update: function (id, input) {
	    return updateOrCreate(this.entries, id, input)
		.then(writeProperties)
		.then(function (data) {
		    return findById(data, id);
		})
		.then(injectType)
		.then(leftmost);
	},
	clear: function () {
	    return clear(this.entries)
		.then(writeProperties);
	},
	erase: function (id) {
	    return erase(this.entries, id)
		.then(writeProperties);
	}
    };

    return readProperties(properties);
};
