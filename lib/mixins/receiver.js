
/*!
 * Cluster - receiver mixin
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

module.exports = function(obj){

  /**
   * Initialize buffer.
   */

  obj._buf = '';

  /**
   * Frame incoming command, buffering the given `chunk`
   * until a frame is complete. Frames are delimited by a
   * line feed.
   *
   * @param {String} chunk
   * @api private
   */

  obj.frame = function(chunk){
    for (var i = 0, len = chunk.length; i < len; ++i) {
      if ('\n' == chunk[i]) {
        var worker
          , obj = JSON.parse(this._buf);
        this._buf = '';
        if ('number' == typeof obj.id) worker = this.children[obj.id];
        this.invoke(obj.method, obj.args, worker);
      } else {
        this._buf += chunk[i];
      }
    }
  };

  /**
   * Invoke `method` with the given `args`.
   *
   * @param {String} method
   * @param {Mixed} args
   * @param {Worker} worker
   * @api private
   */

  obj.invoke = function(method, args, worker){
    if (!method) return;
    if (!Array.isArray(args)) args = [args];
    if (worker) args.unshift(worker);
    if (!this[method]) throw new Error('method ' + method + '() does not exist');
    this[method].apply(this, args);
  };
};