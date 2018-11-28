const program = require('commander');
const pgr = require('../lib/pgr');
const firebase = require('../lib/firebase');

function multiple(val, values) {
  values.push(val);
  return values;
}

program
  .command('create <app-id> <name>')
  .description('Create application')
  .option("-d, --desciption [desciption]", "Application description")
  .action(async (id, name, options) => {
    let payload = {app_id: id, name};
    if( options.description ) payload = description;
    await pgr.createApp(payload);
  });

program
  .command('list')
  .alias('ls')
  .description('List all applications')
  .action(async () => {
    let apps = await pgr.listApps();
    apps = JSON.parse(apps.body);
    for( let app of apps ) {
      console.log(`${app.app_id}: ${app.name}`);
      if( app.description ) console.log(app.description);
      console.log();
    }
  });
  
program
  .command('update-webhooks <app-id>')
  .option("-u, --url [url]", 'Url to notify when pending crowd-input updates', multiple, [])
  .description('Set application webhook urls')
  .action(async (id, options) => {
    await firebase.setWebhooks(id, options.url);
  });

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

if( process.argv.length <= 2 ) {
  program.help();
}

program.parse(process.argv);