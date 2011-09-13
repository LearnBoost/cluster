
/**
 * Module dependencies.
 */

var cluster = require('../');

// Launch the cluster:
//   $ nohup node examples/cli.js &

// Check the status:
//   $ node examples/cli.js status

// View other commands:
//   $ node examples/cli.js --help

cluster('cli-app')
  .use(cluster.pidfiles())
  .use(cluster.debug())
  .use(cluster.cli())
  .listen(3000);
