
## Logger

 File-based logging of both the _master_ and _worker_ processes.
 For example if you spawn 2 workers, you will get the following log files:
 
       master.log
       worker.0.access.log
       worker.0.error.log
       worker.1.access.log
       worker.1.error.log

### Usage

The `logger([path[, level]])` plugin accepts an optional `path`, and optional `level` to control the verbosity of the master process logs. By default the log level is _info_.

Outputting to `./logs`:

     cluster(server)
       .use(cluster.logger())
       .listen(3000);


Outputting to `./tmp/logs`:

     cluster(server)
       .use(cluster.logger('tmp/logs'))
       .listen(3000);

Outputting to `/var/log/node` with a log level of `debug`:

      cluster(server)
        .use(cluster.logger('/var/log/node', 'debug'))
        .listen(3000);
