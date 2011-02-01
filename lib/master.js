

/*!
 * Engine - Master
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Start a new `Master` with the given `server`.
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  this.server = server;
};

/**
 * Defer `http.Server#listen()` call.
 *
 * @api public
 */

Master.prototype.listen = function(){
  this._listen = arguments;
  this.start();
};

/**
 * Start master process.
 *
 * @api private
 */

Master.prototype.start = function(){
  
};

