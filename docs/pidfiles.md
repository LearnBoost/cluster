
## PID Files

 Saves out PID files, for example:
 
       master.pid
       worker.0.pid
       worker.1.pid
       worker.2.pid
       worker.3.pid

### Usage

The `pidfiles([path])` plugin saves pid (process-id) files to the given `path` or `./pids`.

save to `./pids`:

   engine(server)
     .use(engine.pidfiles())
     .listen(3000);

save to `/var/run/node`:

   engine(server)
     .use(engine.logger('/var/run/node'))
     .listen(3000);
