
## Stats

 The stats plugin collects statistics from the events emitter by the master process, and exposes a `stats()` __REPL__ function.


### Usage

To utilize simply `use()` both the `stats()` and `repl()` plugins.

      cluster(server)
        .use(cluster.stats())
        .use(cluster.repl(8888))
        .listen(3000);

Telnet to the repl:

      $ telnet localhost 8888

### stats()

 After manually killing two workers, the stats below show information regarding system load average, uptime, total workers spawned, deaths, worker-specific stats and more.

    cluster> stats()

      Master
      os: Darwin 10.5.0
      state: active
      started: Fri, 11 Feb 2011 16:58:48 GMT
      uptime: 2 minutes
      workers: 4
      deaths: 2

      Resources
      load average: 0.35 0.23 0.15
      cores utilized: 4 / 4
      memory at boot (free / total): 2.18gb / 4.00gb
      memory now (free / total): 2.08gb / 4.00gb

      Workers
      uptime #0: 2 minutes
      uptime #1: 2 minutes
      uptime #2: 1 minute
      uptime #3: 22 seconds

