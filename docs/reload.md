
## Reload

  Restart the server the given `files` have changed.
  `files` may be several directories, filenames, etc.

### Usage

 The `reload(paths[, signal])` plugin accepts a single path, or an array of paths, watching for __mtime__ changes, and re-loading the workers when a change has been made. By default the __SIGTERM__ signal is sent, killing the workers immediately, however we may pass a `signal` for graceful termination as well.

 Reload when files in `./lib` change:

        cluster(server)
          .use(cluster.reload('lib'))
          .listen(3000);

 Reload when files in `./lib`, `./tests`, or the `./index.js` file change:

        cluster(server)
          .use(cluster.reload(['lib', 'tests', 'index.js']))
          .listen(3000);

 Graceful shutdown:
 
       cluster(server)
        .use(cluster.reload('lib', 'SIGQUIT'))
        .listen(3000);