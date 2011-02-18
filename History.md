
0.1.0 / 2011-02-18 
==================

  * Added TCP echo server example
  * Added REPL `shutdown()` function
  * Added REPL `stop()` function
  * Added master spawning strategy
    On restart, master now spawns a new master to accept
    connections while the previous works (and master) finish
    and die off.
  * Added `Master#in()` for environment based usage. Closes #22
    For example:
        cluster(server)
          .in('development')
            .use(cluster.debug())
            .use(cluster.repl())
            .listen(3000)
          .in('production')
            .use(cluster.logger())
            .listen(80);

  * Fixed some test race-conditions
  * Fixed event leak. Closes #18

0.0.4 / 2011-02-17 
==================

  * Fixed `stats()` / `repl()` breakage when used with 0.2.x due to os mod. Closes #16
  * Changed; close _REPL_ connections on shutdown

0.0.3 / 2011-02-16 
==================

  * Added log dependency to _package.json_. Closes #14

0.0.2 / 2011-02-15 
==================

  * Fixed `process.setuid()` typo

0.0.1 / 2011-02-15 
==================

  * Initial commit