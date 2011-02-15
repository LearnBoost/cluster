
/*!
 * Cluster - cli
 * Copyright (c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , Log = require('log');

/**
 * Commands.
 */

var commands = [];

/**
 * TODO:
 *
 * @return {Function}
 * @api public
 */

exports = module.exports = function(){
  return function(master){
    var args = process.argv.slice(2)
      , len = commands.length
      , command
      , arg;

    while (args.length) {
      arg = args.shift();
      for (var i = 0; i < len; ++i) {
        command = commands[i];
        if (~command.flags.indexOf(arg)) {
          command.callback(master);
        }
      }
    }
  }
};

/**
 * Define command `name` with the given callback `fn(master)`
 * and a short `desc`.
 *
 * @param {String} name
 * @param {Function} fn
 * @param {String} desc
 * @return {Object} exports for chaining
 * @api public
 */

exports.define = function(name, fn, desc){
  commands.push({
      flags: name.split(/ *, */)
    , desc: desc
    , callback: fn
  });
  return this;
};

/**
 * Display help information.
 */

exports.define('-h, --help', function(master){
  console.log('\n  Usage: node <file> <command>\n');
  commands.forEach(function(command){
    console.log('    '
      + command.flags.join(', ')
      + '\n    '
      + '\033[90m' + command.desc + '\033[0m');
  });
  console.log();
  process.exit();
}, 'Show help information');