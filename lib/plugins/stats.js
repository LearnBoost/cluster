
/*!
 * Cluster - stats
 * Copyright (c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , Log = require('log')
  , repl = require('./repl')
  , utils = require('../utils')
  , os;

// COMPAT:
try {
  os = require('os');
} catch (err) {
  // ignore
}

/**
 * Enable stat tracking with the given `options`.
 *
 * Options:
 *
 *  - `connections`  enable connection statistics
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function(options){
  options = options || {};
  stats.enableInWorker = options.connections;

  function stats(master){
    var server = master.server;

    // worker stats
    if (master.isWorker) {
      server.on('connection', function(sock){
        master.call('reportStats', 'connection');
        sock.on('close', function(){
          master.call('reportStats', 'disconnection');
        });
      });
    // master stats
    } else {
      master.stats = {
          start: new Date
        , restarts: 0
        , workersSpawned: 0
        , workersKilled: 0
      };

      // 0.4.x
      if (os) {
        master.stats.totalmem = os.totalmem();
        master.stats.freemem = os.freemem();
      }

      // worker stats
      master.reportStats = function(worker, type){
        switch (type) {
          case 'connection':
            worker.stats.connectionsTotal++;
            worker.stats.connectionsActive++;
            break;
          case 'disconnection':
            worker.stats.connectionsActive--;
            break;
        }
      };

      // total workers spawned
      master.on('worker', function(worker){
        ++master.stats.workersSpawned;
        worker.stats = {
            start: new Date
          , connectionsTotal: 0
          , connectionsActive: 0
        };
      });

      // total worker deaths
      master.on('worker killed', function(worker){
        ++master.stats.workersKilled;
      });

      // restarting
      master.on('restarting', function(data){
        ++master.stats.restarts;
        data.stats = master.stats;
      });

      // restart
      master.on('restart', function(data){
        master.stats = data.stats;
        master.stats.start = new Date(master.stats.start);
      });
    }
  }

  return stats;
};

/**
 * REPL statistics command.
 */

repl.define('stats', function(master, sock){
  var active = master.children.length
    , total = master.stats.workersSpawned
    , deaths = master.stats.workersKilled
    , restarts = master.stats.restarts;

  // master stats
  sock.title('Master');
  if (os) sock.row('os', os.type() + ' ' + os.release());
  sock.row('state', master.state);
  sock.row('started', master.stats.start.toUTCString());
  sock.row('uptime', utils.formatDateRange(new Date, master.stats.start));
  sock.row('restarts', restarts);
  sock.row('workers', active);
  sock.row('deaths', deaths);

  // resources
  if (os) {
    sock.title('Resources');
    sock.row('load average', os.loadavg().map(function(n){ return n.toFixed(2); }).join(' '));
    sock.row('cores utilized', active + ' / ' + os.cpus().length);
    var free = utils.formatBytes(master.stats.freemem);
    var total = utils.formatBytes(master.stats.totalmem);
    sock.row('memory at boot (free / total)', free + ' / ' + total);
    var free = utils.formatBytes(os.freemem());
    var total = utils.formatBytes(os.totalmem());
    sock.row('memory now (free / total)', free + ' / ' + total);
  }

  // worker stats
  sock.title('Workers');
  master.children.forEach(function(worker){
    var stats = '';

    // uptime
    stats += utils.formatDateRange(new Date, worker.stats.start);

    // connections
    if (worker.stats.connectionsTotal) {
      stats += ' ('
        + worker.stats.connectionsActive
        + '/'
        + worker.stats.connectionsTotal
        + ')';
    }

    sock.row(worker.id, stats);
  });
  sock.write('\n');
}, 'Display server statistics');
