
/*!
 * Cluster - cli
 * Copyright (c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , Log = require('log')
  , ESRCH = require('constants').ESRCH;

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
    requirePIDs(master);

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
 * Report master / worker status based on
 * the PID files saved by the pidfiles()
 * plugin.
 */

exports.define('-s, --status, status', function(master){
  var dir = master.pidfiles
    , files = fs.readdirSync(dir);

  console.log();

  // only pids
  files.filter(function(file){
    return file.match(/\.pid$/);
  // check status
  }).forEach(function(file){
    var path = dir + '/' + file
      , pid = fs.readFileSync(path, 'ascii')
      , pid = parseInt(pid, 10)
      , name = file.replace('.pid', '').replace('.', ' ')
      , color
      , status;

    try {
      process.kill(pid, 0);
      status = 'alive';
      color = '36';
    } catch (err) {
      if (ESRCH == err.errno) {
        color = '31';
        status = 'dead';
      } else {
        throw err;
      }
    }

    console.log('  %s\033[90m %d\033[0m \033[' + color + 'm%s\033[0m'
      , name
      , pid
      , status);
  });

  console.log();
  process.exit();
}, 'Output cluster status');

/**
 * Display help information.
 */

exports.define('-h, --help, help', function(master){
  console.log('\n  Usage: node <file> <command>\n');
  commands.forEach(function(command){
    console.log('    '
      + command.flags.join(', ')
      + '\n    '
      + '\033[90m' + command.desc + '\033[0m'
      + '\n');
  });
  console.log();
  process.exit();
}, 'Show help information');

/**
 * Require `pidfiles()` plugin.
 *
 * @param {Master} master
 * @api private
 */

function requirePIDs(master) {
  if (master.pidfiles) return;
  throw new Error('cli() plugin requires pidfiles(), please add pidfiles() before cli()');
}