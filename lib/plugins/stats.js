
/*!
 * Engine - stats
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var os = require('os')
  , fs = require('fs')
  , Log = require('log')
  , repl = require('./repl');

/**
 * Enable stat tracking.
 *
 * @return {Function}
 * @api public
 */

module.exports = function(){
  return function(master){
    master.stats = {
        start: new Date
      , totalmem: os.totalmem()
      , freemem: os.freemem()
      , totalWorkersSpawned: 0
    };

    // total workers spawned
    master.on('worker', function(worker){
      ++master.stats.totalWorkersSpawned;

      // worker-specific stats
      worker.stats = {
        start: new Date
      };
    });
  }
};

/**
 * REPL statistics command.
 */

repl.stats = function(master, sock){
  // master stats
  sock.head('Master');
  sock.row('started', master.stats.start.toUTCString());
  sock.row('uptime', diff(new Date, master.stats.start));
  sock.row('workers', master._workers.length);
  sock.row('spawned', master.stats.totalWorkersSpawned);

  // resources
  sock.head('Resources');
  sock.row('cores utilized', master._workers.length + ' / ' + os.cpus().length);
  var free = formatBytes(master.stats.freemem);
  var total = formatBytes(master.stats.totalmem);
  sock.row('memory at boot (free / total)', free + ' / ' + total);
  var free = formatBytes(os.freemem());
  var total = formatBytes(os.totalmem());
  sock.row('memory now (free / total)', free + ' / ' + total);

  // worker stats
  sock.write('\n');
};

repl.stats.description = 'Display server statistics';

/**
 * Format byte-size.
 *
 * @param {Number} bytes
 * @return {String}
 * @api private
 */

function formatBytes(bytes) {
  var kb = 1024
    , mb = 1024 * kb
    , gb = 1024 * mb;
  if (bytes < kb) return bytes + 'b';
  if (bytes < mb) return (bytes / kb).toFixed(2) + 'kb';
  if (bytes < gb) return (bytes / mb).toFixed(2) + 'mb';
  return (bytes / gb).toFixed(2) + 'gb';
}

/**
 * Format date difference between `a` and `b`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {String}
 * @api private
 */

function diff(a, b) {
  var diff = a - b
    , second = 1000
    , minute = second * 60
    , hour = minute * 60
    , day = hour * 24;

  if (diff < second) return diff + ' milliseconds';
  if (diff < minute) return (diff / second).toFixed(0) + ' seconds';
  if (diff < hour) return (diff / minute).toFixed(0) + ' minutes';
  if (diff < day) return (diff / hour).toFixed(0) + ' hours';
  return (diff / day).toFixed(1) + ' days';
}