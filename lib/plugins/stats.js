
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
  , Log = require('log');

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
      , startTotalmem: os.totalmem()
      , startFreemem: os.freemem()
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