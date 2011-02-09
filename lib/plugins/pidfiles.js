
/*!
 * Engine - pidfiles
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Save pidfiles to the given `dir` or `./pids`.
 *
 * Examples:
 *
 *    // save to ./pids
 *    engine(server)
 *      .use(engine.pidfiles())
 *      .listen(3000);
 *
 *    // save to /tmp
 *    engine(server)
 *      .use(engine.pidfiles('/tmp'))
 *      .listen(3000);
 *
 *    // save to /var/run/node
 *    engine(server)
 *      .use(engine.logger('/var/run/node'))
 *      .listen(3000);
 *
 * @param {String} dir
 * @return {Function}
 * @api public
 */

module.exports = function(dir, level){
  return function(master){
    dir = master.resolve(dir || 'pids');

    console.log(master);
  }
};