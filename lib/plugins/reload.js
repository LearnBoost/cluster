
/*!
 * Cluster - reload
 * Copyright (c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , basename = path.basename
  , extname = path.extname;

/**
 * Restart the server the given js `files` have changed.
 * `files` may be several directories, filenames, etc,
 * defaulting to the server's root directory.
 *
 * Options:
 *
 *   - `signal` Signal to send, defaults to __SIGTERM__
 *   - `interval` Watcher interval, defaulting to `100`
 *
 * Examples:
 *
 *     cluster(server)
 *       .use(cluster.reload())
 *       .listen(3000);
 *
 *     cluster(server)
 *       .use(cluster.reload('lib'))
 *       .listen(3000);
 *     
 *     cluster(server)
 *       .use(cluster.reload(['lib', 'tests', 'index.js']))
 *       .listen(3000);
 *
 *     cluster(server)
 *       .use(cluster.reload('lib', { signal: 'SIGQUIT', interval: 60000 }))
 *       .listen(3000);
 *
 * Ignore Directories:
 *
 *  By default `reload()` will ignore the following directories:
 *
 *   - node_modules
 *   - support
 *   - examples
 *   - test
 *   - bin
 *
 *  Alter with `reload.ignoreDirectories`
 *
 *      cluster.reload.ignoreDirectories.push('src');
 *
 * @param {String|Array} files
 * @param {Options} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function(files, options){
  options = options || {};

  // defaults
  var sig = options.sig || 'SIGTERM'
    , interval = options.interval || 100;

  return function(master){
    var restarting;

    if (!files) files = master.dir;
    if (!Array.isArray(files)) files = [files];
    files.forEach(traverse);

    // traverse file if it is a directory
    // otherwise setup the watcher
    function traverse(file) {
      file = master.resolve(file);
      fs.stat(file, function(err, stat){
        if (!err) {
          if (stat.isDirectory()) {
            if (~exports.ignoreDirectories.indexOf(basename(file))) return;
            fs.readdir(file, function(err, files){
              files.map(function(f){
                return file + '/' + f;
              }).forEach(traverse);
            });
          } else {
            watch(file);
          }
        }
      });
    }

    // watch file for changes
    function watch(file) {
      if (!~exports.watchFileExtensions.indexOf(extname(file))) return;
      fs.watchFile(file, { interval: interval }, function(curr, prev){
        if (restarting) return;
        if (curr.mtime > prev.mtime) {
          console.log('  \033[36mchanged\033[0m \033[90m- %s\033[0m', file);
          master.restart(sig);
        }
      });
    }

    master.on('restarting', function(){
      restarting = true;
    });
  }
};

/**
 * Directories to ignore.
 */

exports.ignoreDirectories = ['node_modules', 'support', 'test', 'bin'];

/**
 * File extensions to watch.
 */

exports.watchedFileExtensions = ['.js'];
