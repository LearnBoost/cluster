
## API

 The Cluster API at its core is extremely simple, all we need to do is pass
 our http `server` to `cluster()`, then call `listen()` as we would on the `http.Server` itself.


     var cluster = require('../')
       , http = require('http');

     var server = http.createServer(function(req, res){
       res.writeHead(200);
       res.end('Hello World');
     });

     cluster(server)
       .listen(3000);

### Plugins

 A plugin simple a function that accepts the `master` process. Most plugin functions _return_ another anonymous function, allowing them to accept options, for example:
 
      function myPlugin(path){
        return function(master) {
          // do stuff
        }
      }

 To use them, all we need to do is pass it to the `use()` method:
 
      cluster(server)
        .use(myPlugin('/some/path'))
        .listen(3000);

 To use a plugin that is bundled with Cluster simply grab it from the `cluster` object:
 
       cluster(server)
         .use(cluster.logger())
         .listen(3000);

### Settings

 Below are the settings available:
 
   - `workers`  Number of workers to spawn, defaults to the number of CPUs
   - `working directory`  Working directory defaulting to `/`
   - `backlog`  Connection backlog, defaulting to 128
   - `socket path`  Master socket path defaulting to `./master.sock`

 We can take what we have now, and go on to apply settings using the `set(option, value)` method. For example:
 
      cluster(server)
        .set('working directory', '/')
        .set('workers', 5)
        .listen(3000);

### Signals

 Cluster performs the following actions when handling signals:
 
   - `SIGINT`   hard shutdown
   - `SIGTERM`  hard shutdown
   - `SIGQUIT`  graceful shutdown
   - `SIGUSR2`  restart workers
   - `SIGHUP`   ignored

### Events

 The following events are emitted, useful for plugins or general purpose logging etc.
 
   - `start`. When the server is starting (pre-spawn)
   - `worker`. When a worker is spawned, passing the `worker`
   - `listening`. When the server is listening for connections (post-spawn)
   - `broadcast`. When master is broadcasting a `cmd` with `args`
   - `closing`. When master is gracefully shutting down
   - `close`. When master has completed shutting down
   - `worker killed`. When a worker has died
   - `kill`. When a `signal` is being sent to all workers
   - `restart`. Restart requested by REPL or signal
