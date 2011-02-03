
/*!
 * Engine - receiver mixin
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

module.exports = function(obj){

  /**
   * Frame incoming command, buffering the given `chunk`
   * until a frame is complete.
   *
   * @param {String} chunk
   * @api private
   */

  obj.frameCommand = function(chunk){
    this._buf = this._buf || '';
    this.braces = this.braces || 0;

    for (var i = 0, len = chunk.length; i < len; ++i) {
      if ('{' == chunk[i]) ++this.braces;
      if ('}' == chunk[i]) --this.braces;
      this._buf += chunk[i];
      if (0 == this.braces) {
        var obj = JSON.parse(this._buf);
        this._buf = '';
        this.invokeCommand(obj.cmd, obj.args);
      }
    }
  };

  /**
   * Invoke `cmd` with the given `args`.
   *
   * @param {String} cmd
   * @param {Mixed} args
   * @api private
   */

  obj.invokeCommand = function(cmd, args){
    if (!cmd) return;
    if (!Array.isArray(args)) args = [args];
    this[cmd].apply(this, args);
  };
};