
/*!
 * Engine - logger
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Enable stdout / stderr logs for both the master
 * process, as well as workers.
 *
 * These output to the given `dir`, or `./logs`
 * relative to the server's file.
 *
 * Examples:
 *
 *    // log to ./logs
 *    engine(server)
 *      .use(engine.logger())
 *      .listen(3000);
 *
 *    // log to ./app/logs
 *    engine(server)
 *      .use(engine.logger('./app/logs'))
 *      .listen(3000);
 *
 *    // log to /var/log/node
 *    engine(server)
 *      .use(engine.logger('/var/log/node'))
 *      .listen(3000);
 *
 * @param {String} dir
 * @return {Function}
 * @api public
 */

module.exports = function(dir){
  return function(master){
    dir = master.resolve(dir || 'logs');

    // Master log
    master.log = fs.createWriteStream(dir + '/master.log', { flags: 'a' });

    // Children
    master.on('worker', function(worker){
      var path = dir + '/worker.' + worker.id + '.log';
      worker.log = fs.createWriteStream(path, { flags: 'a' });
    });
  }
};