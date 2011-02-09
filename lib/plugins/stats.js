
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
  , repl = require('./repl')
  , utils = require('../utils');

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

repl.define('stats', function(master, sock){
  var active = master.children.length
    , total = master.stats.totalWorkersSpawned;

  // master stats
  sock.head('Master');
  sock.row('os', os.type() + ' ' + os.release());
  sock.row('state', master.state);
  sock.row('started', master.stats.start.toUTCString());
  sock.row('uptime', utils.formatDateRange(new Date, master.stats.start));
  sock.row('workers', active);
  sock.row('deaths', total - active);

  // resources
  sock.head('Resources');
  sock.row('load average', os.loadavg().map(function(n){ return n.toFixed(2); }).join(' '));
  sock.row('cores utilized', active + ' / ' + os.cpus().length);
  var free = utils.formatBytes(master.stats.freemem);
  var total = utils.formatBytes(master.stats.totalmem);
  sock.row('memory at boot (free / total)', free + ' / ' + total);
  var free = utils.formatBytes(os.freemem());
  var total = utils.formatBytes(os.totalmem());
  sock.row('memory now (free / total)', free + ' / ' + total);

  // worker stats
  sock.head('Workers');
  master.children.forEach(function(worker){
    sock.row(
      'uptime #' + worker.id
      , utils.formatDateRange(new Date, worker.stats.start));
  });
  sock.write('\n');
}, 'Display server statistics');
