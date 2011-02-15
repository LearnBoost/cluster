
/**
 * Module dependencies.
 */

var http = require('http')
  , should = require('../support/should');

// COMPAT:

http.get = function(options, fn){
  var client = http.createClient(options.port, options.host)
    , req = client.request('GET', options.path || '/');
  req.on('response', fn).end();
  return req;
};