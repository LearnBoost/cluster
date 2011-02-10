
/*!
 * Engine - reload
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
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
 *     engine(server)
 *       .use(engine.reloader('lib'))
 *       .listen(3000);
 *     
 *     engine(server)
 *       .use(engine.reloader(['lib', 'tests', 'index.js']))
 *
 * @param {String|Array} files
 * @return {Function}
 * @api public
 */

module.exports = function(files){
  if (!files) throw new Error('reload() files required');
  if (!Array.isArray(files)) files = [files];
  return function(master){
    files.forEach(function(file){
      file = master.resolve(file);
      fs.watchFile(file, { interval: 100 }, function(curr, prev){
        if (curr.mtime > prev.mtime) {
          console.log('  \033[36mchanged\033[0m \033[90m%s\033[0m', file);
          master.restart();
        }
      });
    });
  }
};