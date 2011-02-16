
# Cluster

 [Cluster](http://learnboost.github.com/cluster) is an extensible multi-core server manager for [node.js](http://nodejs.org).

## Installation

    $ npm install cluster

## Features

  - zero-downtime restart
  - hard shutdown support
  - graceful shutdown support
  - resuscitates workers
  - workers commit suicide when master dies 
  - spawns one worker per cpu (by default)
  - extensible via plugins
  - bundled plugins
    - [cli](http://learnboost.github.com/cluster/docs/cli.html): provides a command-line interface for your cluster
    - [debug](http://learnboost.github.com/cluster/docs/debug.html): verbose debugging information
    - [logger](http://learnboost.github.com/cluster/docs/logger.html): master / worker logs
    - [pidfiles](http://learnboost.github.com/cluster/docs/pidfiles.html): writes master / worker pidfiles
    - [reload](http://learnboost.github.com/cluster/docs/reload.html): reloads workers when files change
    - [repl](http://learnboost.github.com/cluster/docs/repl.html): perform real-time administration
    - [stats](http://learnboost.github.com/cluster/docs/stats.html): adds real-time statistics to the `repl` plugin
  - supports node 0.2.x
  - supports node 0.4.x

## Example

      var cluster = require('cluster')
        , http = require('http');

      var server = http.createServer(function(req, res){
        console.log('%s %s', req.method, req.url);
        var body = 'Hello World';
        res.writeHead(200, { 'Content-Length': body.length });
        res.end(body);
      });

      cluster(server)
        .use(cluster.logger('logs'))
        .use(cluster.stats())
        .use(cluster.pidfiles('pids))
        .use(cluster.cli())
        .use(cluster.repl(8888))
        .listen(3000);

## Running Tests

First:

     $ git submodule update --init

Then:

     $ make test

## Authors

  * TJ Holowaychuk

## License 

(The MIT License)

Copyright (c) 2011 LearnBoost &lt;dev@learnboost.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.