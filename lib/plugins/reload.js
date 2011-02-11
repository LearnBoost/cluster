
/*!
 * Cluster - reload
 * Copyright (c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');

/**
 * Restart the server the given `files` have changed.
 * `files` may be several directories, filenames, etc.
 *
 * Examples:
 *
 *     cluster(server)
 *       .use(cluster.reloader('lib'))
 *       .listen(3000);
 *     
 *     cluster(server)
 *       .use(cluster.reloader(['lib', 'tests', 'index.js']))
 *       .listen(3000);
 *
 *     cluster(server)
 *       .use(cluster.reloader('lib', 'SIGQUIT'))
 *       .listen(3000);
 *
 * @param {String|Array} files
 * @param {String} sig
 * @return {Function}
 * @api public
 */

module.exports = function(files, sig){
  if (!files) throw new Error('reload() files required');
  if (!Array.isArray(files)) files = [files];
  return function(master){
    files.forEach(traverse);

    // traverse file if it is a directory
    // otherwise setup the watcher
    function traverse(file) {
      file = master.resolve(file);
      fs.stat(file, function(err, stat){
        if (!err) {
          if (stat.isDirectory()) {
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
      fs.watchFile(file, { interval: 100 }, function(curr, prev){
        if (curr.mtime > prev.mtime) {
          console.log('  \033[36mchanged\033[0m \033[90m%s\033[0m', file);
          master.restart(sig || 'SIGTERM');
        }
      });
    }
  }
};