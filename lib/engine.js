
/*!
 * Engine
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Master = require('./master');

/**
 * Export `start` as the module.
 */

exports = module.exports = start;

/**
 * Library version.
 */

exports.version = '0.0.1';

/**
 * Start a new `Master` with the given `server`.
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

function start(server) {
  return new Master(server);
}

/**
 * Expose middleware.
 */

// TODO: lazy require

exports.logger = require('./plugins/logger');