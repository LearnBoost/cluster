
/*!
 * Engine - logger
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , Log = require('log');

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

    // master log
    var stream = fs.createWriteStream(dir + '/master.log', { flags: 'a' });
    master.log = new Log(Log.INFO, stream);

    master.on('start', function(){
      master.log.info('master started');
    });

    master.on('connection', function(sock){
      master.log.debug('worker connected');
    });

    // children
    master.on('worker', function(worker){
      var proc = worker.proc
        , access = dir + '/worker.' + worker.id + '.access.log'
        , error = dir + '/worker.' + worker.id + '.error.log';

      master.log.info('spawned worker ' + worker.id);

      // worker-specific logs
      worker.accessLog = fs.createWriteStream(access, { flags: 'a' });
      worker.errorLog = fs.createWriteStream(error, { flags: 'a' });

      // redirect stdout / stderr
      proc.stdout.on('data', function(chunk){ worker.accessLog.write(chunk); });
      proc.stderr.on('data', function(chunk){ worker.errorLog.write(chunk); });

      // TODO: close / log when child dies
    });
  }
};