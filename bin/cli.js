let program = require('commander');
let pkg     = require('../package.json');

program
    .version(pkg.version);

program
    .command('start')
    .description('start fetch resource')
    .option('-c, --config', 'set icon repo config file path');

module.exports = program.parse(process.argv);