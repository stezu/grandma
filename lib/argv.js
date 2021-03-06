/* jshint node: true */

var _ = require('lodash');

module.exports = function parseArgv(defaults) {
    var yargs = require('yargs');

    function addCommonOptions(argv) {
        return argv
            .option('out', {
                alias: 'o',
                type: 'string',
                default: 'stdout',
                describe: 'The location to write output data to.'
            });
    }

    function addCommonCommand(argv, exampe) {
        return argv
            .example(exampe)
            .alias('h', 'help')
            .alias('h', '?')
            .help();
    }

    function runCommand(argv) {
        return argv.command('run <testname>', 'Run a test by name.', function(yargs) {
            yargs = addCommonCommand(yargs, 'grandma run <testname> --duration=2m --rate=200');
            yargs = addCommonOptions(yargs);
            yargs = setDefaults(yargs);
            
            return yargs
                .option('duration', {
                    alias: 'd',
                    demand: true,
                    type: 'string',
                    describe: 'The time for which the test will run.'
                })
                .option('rate', {
                    alias: 'r',
                    type: 'number',
                    describe: 'The rate of the tests, in n per second.'
                })
                .option('concurrent', {
                    alias: 'c',
                    type: 'number',
                    describe: 'The amount of concurrent tests to run at once.'
                })
                .option('threads', {
                    type: 'number',
                    default: 1,
                    describe: 'The amount of threads to use to run tests.'
                });
        });
    }

    function reportCommand(argv) {
        return argv.command('report [glob]', 'Summarize the content of report files.', function(yargs) {
            yargs = addCommonCommand(yargs, 'grandma report *.txt --type=text');
            yargs = addCommonOptions(yargs);
            yargs = setDefaults(yargs);
            
            return yargs
                .option('type', {
                    alias: 't',
                    type: 'string',
                    choices: [ 'json', 'text', 'plot' ],
                    describe: 'The type of reporter to output'
                });
            }
        );
    }

    function helpCommand(argv) {
        return argv
            .command('help', 'Print this help message.')
            .option('help', {
                alias: 'h',
                describe: 'This help message.'
            });
    }

    function listCommand(argv) {
        return argv.command('list', 'List all available test names.');
    }
    
    function setDefaults(argv) {
        _.forEach(defaults || {}, function(val, prop) {
            argv.default(prop, val);
        });
        
        return argv;
    }

    var argv = yargs.usage('\ngrandma <command> [options]');

    argv = runCommand(argv);
    argv = reportCommand(argv);
    argv = listCommand(argv);
    argv = setDefaults(argv);
    argv = helpCommand(argv);
    
    var returnObj = argv
        .help()
        .alias('v', 'version')
        .version()
    
        // add examples that show some common usage
        .example('grandma <command> -?')
        .example('grandma run <testname> --duration=10m --rate=300 --out=file.txt')
        .example('grandma report file.txt --type=plot --out=file.html')

        .argv;

    Object.defineProperty(returnObj, '_yargs', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: yargs
    });
    
    return returnObj;
};
