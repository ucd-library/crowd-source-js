const program = require('commander');

program
  .version(require('./package').version)
  .command('collections', 'manage crowd-source collections')
  .command('items', 'manage crowd-source items')
  .command('apps', 'manage crowd-source apps')
  .command('config', 'show/update CLI config')
  .parse(process.argv);