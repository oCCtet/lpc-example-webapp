// Internal join data model maintains a JSON-format configuration
// file and calls the library functions to configure the switch.
//
// Copyright (C) 2015 Teleste Corporation

/* globals app: false */

"use strict";

var ij = require("../lib/internaljoin");
var fs = require("fs");
var Q = require("q");
var _ = require("lodash");

var filename = "internal-join.conf";
var ijoin;

function readInternaljoinConfig (obj) {
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
	defer.reject(new Error("Failed to read internaljoin: " + e.message));
    }

    return defer.promise;
}

function applyConfig (obj) {
    return Q.fcall(function () {
	_.forEach(obj.config, function (value) {
	    ijoin.add(value, function (err) {
		if (err)
		    console.error("Failed to add: " + err.message);
	    });
	});
	return obj;
    });
}

function writeInternaljoinConfig (config) {
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
	defer.reject(new Error("Failed to write internaljoin: " + e.message));
    }

    return defer.promise;
}

function injectTemplate (config) {
    return Q.fcall(function () {
	return [{
	    _template: true,
	    _type: "InternalJoin",
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
	    return _.merge({}, item, { _type: "InternalJoin" });
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

    ijoin.clear(function (err) {  // jshint ignore: line
	// ignore any clearing error
	config.splice(0, config.length);

	_.forEach(data, function (value) {
	    ijoin.add(value, function (err) {
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

    ijoin.add(input, function (err) {
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
	ijoin.add(input, function (err) {
	    if (err) {
		defer.reject(new Error("Failed to add: " + err.message));
	    } else {
		config.push(_.merge({ id: id }, input));
		defer.resolve(config);
	    }
	});
    } else {
	ijoin.delete(item, function (err) {  // jshint ignore: line
	    // ignore any deletion error
	    var newItem = _.merge({}, item, input);
	    ijoin.add(newItem, function (err) {
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

    ijoin.clear(function (err) {
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
	ijoin.delete(item, function (err) {
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
    var internaljoin = {
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
		.then(writeInternaljoinConfig)
		.then(injectType);
	},
	create: function (input) {
	    return allocateNewEntry(this.config, input)
		.then(function (obj) {
		    return writeInternaljoinConfig(obj.coll)
			.then(function (coll) {
			    return findById(coll, obj.id);
			});
		})
		.then(injectType)
		.then(leftmost);
	},
	update: function (id, input) {
	    return updateOrCreate(this.config, id, input)
		.then(writeInternaljoinConfig)
		.then(function (data) {
		    return findById(data, id);
		})
		.then(injectType)
		.then(leftmost);
	},
	clear: function () {
	    return clear(this.config)
		.then(writeInternaljoinConfig);
	},
	erase: function (id) {
	    return erase(this.config, id)
		.then(writeInternaljoinConfig);
	}
    };

    ijoin = ij(app.config.lpcApiAddress);

    return readInternaljoinConfig(internaljoin)
	.then(applyConfig);
};
