// Input streaming data model maintains a JSON-format configuration
// file and calls the library functions to configure the switch.
//
// Copyright (C) 2015 Teleste Corporation

/* globals app: false */

"use strict";

var is = require("../lib/inputstreaming");
var fs = require("fs");
var Q = require("q");
var _ = require("lodash");

var filename = "input-streaming.conf";
var istream;

function readInputStreamingConfig (obj) {
    var defer = Q.defer();
    var configPath = app.config.persistentConfigDir + filename;

    try {
	fs.readFile(configPath, { encoding: "utf8" }, function (err, data) {
	    if (!err) {
		obj.config = JSON.parse(data);
	    }
	    defer.resolve(obj);
	});
    } catch (e) {
	defer.reject(new Error("Failed to read: " + e.message));
    }

    return defer.promise;
}

function applyConfig (obj) {
    var defer = Q.defer();
    var added = 0;

    istream.clear(function (err) {  // jshint ignore: line
	// ignore any clearing error
	if (_.isEmpty(obj.config)) {
	    defer.resolve(obj);
	    return;
	}
	_.forEach(obj.config, function (value) {
	    istream.add(value, function (err) {
		if (err) {
		    defer.reject(new Error("Failed to add: " + err.message));
		    return;
		}
		if (++added === obj.config.length) {
		    defer.resolve(obj);
		}
	    });
	});
    });

    return defer.promise;
}

function writeInputStreamingConfig (config) {
    var defer = Q.defer();
    var configPath = app.config.persistentConfigDir + filename;

    try {
	fs.writeFile(configPath, JSON.stringify(config), function (err) {
	    if (err) {
		throw err;
	    } else {
		defer.resolve(config);
	    }
	});
    } catch (e) {
	defer.reject(new Error("Failed to write: " + e.message));
    }

    return defer.promise;
}

function injectTemplate (config) {
    return Q.fcall(function () {
	return [{
	    _template: true,
	    _type: "InputStreaming",
	    name: "",
	    addr: "",
	    port: 0,
	    vlan: 4000
	}].concat(config);
    });
}

function injectType (config) {
    return Q.fcall(function () {
	return _.map(config, function (item) {
	    return _.merge({}, item, { _type: "InputStreaming" });
	});
    });
}

function findById (config, id) {
    var item = _.findWhere(config, { "id": id });
    if (item === undefined)
	throw new Error("No entry with ID " + id);
    return [ item ];
}

function promiseToFindById (config, id) {
    return Q.fcall(function () {
	return findById(config, id);
    });
}

function leftmost (data) {
    return Q.fcall(function () {
	return _.first(data);
    });
}

function replace (config, input) {
    var defer = Q.defer();
    var data = _.isArray(input) ? input : [ input ];
    var added = 0;

    istream.clear(function (err) {  // jshint ignore: line
	// ignore any clearing error
	config.splice(0, config.length);
	if (_.isEmpty(data)) {
	    defer.resolve(config);
	    return;
	}
	_.forEach(data, function (value) {
	    istream.add(value, function (err) {
		if (err) {
		    defer.reject(new Error("Failed to add: " + err.message));
		    return;
		}
		config.push(value);
		if (++added === data.length) {
		    defer.resolve(config);
		}
	    });
	});
    });

    return defer.promise;
}

function allocateNewEntry (config, input) {
    var defer = Q.defer();
    var newId = _.chain(config)
	.sortBy("id")
	.reduce(function (candidate, item) {
	    return candidate === item.id ? ++candidate : candidate;
	}, 0)
	.value();

    istream.add(input, function (err) {
	if (err) {
	    defer.reject(new Error("Failed to add: " + err.message));
	} else {
	    config.push(_.merge({ id: newId }, input));
	    defer.resolve({ id: newId, coll: config });
	}
    });

    return defer.promise;
}

function updateOrCreate (config, id, input) {
    var defer = Q.defer();
    var item = _.findWhere(config, { "id": id });

    if (item === undefined) {
	istream.add(input, function (err) {
	    if (err) {
		defer.reject(new Error("Failed to add: " + err.message));
	    } else {
		config.push(_.merge({ id: id }, input));
		defer.resolve(config);
	    }
	});
    } else {
	istream.delete(item, function (err) {  // jshint ignore: line
	    // ignore any deletion error
	    var newItem = _.merge({}, item, input);
	    istream.add(newItem, function (err) {
		if (err) {
		    defer.reject(new Error("Failed to update: " + err.message));
		} else {
		    _.merge(item, input);
		    defer.resolve(config);
		}
	    });
	});
    }

    return defer.promise;
}

function clear (config) {
    var defer = Q.defer();

    istream.clear(function (err) {
	if (err) {
	    defer.reject(new Error("Failed to clear: " + err.message));
	} else {
	    config.splice(0, config.length);
	    defer.resolve(config);
	}
    });

    return defer.promise;
}

function erase (config, id) {
    var defer = Q.defer();
    var item = _.findWhere(config, { "id": id });

    if (item !== undefined) {
	istream.delete(item, function (err) {
	    if (err) {
		defer.reject(new Error("Failed to delete: " + err.message));
	    } else {
		_.remove(config, { "id": id });
		defer.resolve(config);
	    }
	});
    } else {
	defer.resolve(config);
    }

    return defer.promise;
}

module.exports = function () {
    var inputstreaming = {
	config: [],
	list: function () {
	    return injectType(this.config)
		.then(injectTemplate);
	},
	retrieve: function (id) {
	    return promiseToFindById(this.config, id)
		.then(injectType)
		.then(leftmost);
	},
	replace: function (input) {
	    return replace(this.config, input)
		.then(writeInputStreamingConfig)
		.then(injectType);
	},
	create: function (input) {
	    return allocateNewEntry(this.config, input)
		.then(function (obj) {
		    return writeInputStreamingConfig(obj.coll)
			.then(function (coll) {
			    return findById(coll, obj.id);
			});
		})
		.then(injectType)
		.then(leftmost);
	},
	update: function (id, input) {
	    return updateOrCreate(this.config, id, input)
		.then(writeInputStreamingConfig)
		.then(function (data) {
		    return findById(data, id);
		})
		.then(injectType)
		.then(leftmost);
	},
	clear: function () {
	    return clear(this.config)
		.then(writeInputStreamingConfig);
	},
	erase: function (id) {
	    return erase(this.config, id)
		.then(writeInputStreamingConfig);
	}
    };

    istream = is(app.config.lpcApiAddress);

    return readInputStreamingConfig(inputstreaming)
	.then(applyConfig);
};
