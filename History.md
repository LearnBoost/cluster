
0.3.1 / 2011-02-28 
==================

  * Added `cluster(filename)` support. Closes #45
    This is highly recommended, view the API docs
    on the site for more info.

0.3.0 / 2011-02-28 
==================

  * Added "worker exception" event. Closes #41
  * Added `listen()` host dns resolution. Closes #35
  * Added `pidfiles()` helper `master.pidof(name)`
  * Added; `reload()` ignoring _node_modules_ and similar dirs. Closes #31
  * Fixed master __PPID__ reference. Closes #38
  * Fixed restart __SIGQUIT__ default
  * Fixed; using `-g` for graceful shutdown instead of duplicate `-s`. Closes #39

0.2.4 / 2011-02-25 
==================

  * Added `Master#preventDefault` support to clean `cli()`.
    Plugins can now tell master to "prevent its default behaviour", aka
    listening for connections.

  * Fixed bug preventing consistent envs. Closes #37 [reported by sambarnes]
    This caused `require.paths` to be altered.

  * Fixed; throw `pidfiles()` related errors, instead of ignoring

0.2.3 / 2011-02-21 
==================

  * Fixed `reload()` plugin; protect against cyclic restarts.

0.2.2 / 2011-02-21 
==================

  * Added __SIGCHLD__ trap to notify master of killed worker.
    This means that master can now recover a child that
    is __KILL__ed.
  * Removed `Master#workerKilled()` call from worker

0.2.1 / 2011-02-21 
==================

  * Added `Master#do()`

0.2.0 / 2011-02-21 
==================

  * Added; maintaining worker count on __SIGCHLD__. Closes #28
  * Added; defaulting `reload()` to the servers root dir
  * Changed; `reload()` filtering out non-js files. Closes #30
  * Removed __SIGHUP__ trap from worker

0.1.1 / 2011-02-18 
==================

  * Added vhost example
  * Added restarts stat
  * Added `'all'` env support, `in('all')` executing regardless
    of the environment. Useful when `listen()`ing on the same port
    regardless.

  * Changed; `working directory` setting defaulting to the script directory (POLS)

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