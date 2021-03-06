#!/usr/bin/env node
/* jshint node: true */

var NAME = 'grandma';

var fs = require('fs');
var path = require('path');
var util = require('util');

var _ = require('lodash');
var glob = require('glob');
var rc = require('rc');
var globfile = require('glob-filestream');

var grandma = require('../index');
var argv = {};

process.title = NAME;

function exitWithError(msg) {
    process.stderr.write(msg + '\n\n');
    process.exit(1);            
}

function noTestsFoundErr(directory) {
    return exitWithError(util.format(
        '\n%s\n%s',
        'No tests found.',
        directory ?
            'Try setting the directory or make sure there are tests in ' + directory + '.' : 
            'Try setting the directory.'
    ));
}

function loadTests(opts, callback) {
    if (!_.isString(opts.directory)) {
        return noTestsFoundErr();
    }
    
    var globPattern = path.resolve(opts.directory, '**/*.js');
    
    glob(globPattern, {
        ignore: ['node_modules']
    }, function(err, files) {
        if (err) {
            process.stderr.on('drain', function() {
                process.exit(1);
            });
            process.stderr.write(
                util.format('Encountered an error: %s\n%s\n', err.message, err.stack)
            );
        }
        
        if (files.length === 0) {
            return noTestsFoundErr(opts.directory);
        }
        
        opts.tests = files.map(function(filepath) {
            return {
                path: filepath,
                name: path.basename(filepath, '.js')
            };
        });
        
        callback(err);
    });
}

function getDestinationStream(opts) {
    var output = process.stdout;
    
    if (_.isString(opts.out) && opts.out !== 'stdout') {
        output = fs.createWriteStream(path.resolve('.', opts.out));
    }
    
    return output;
}

function getInputStream(glob) {
    var input = process.stdin;
    
    if (glob !== 'stdin') {
        input = globfile(glob);
    }
    
    return input;
}

function init(callback) {
    var opts = _.clone(argv);
    
    loadTests(opts, function(err) {
        callback(err, opts);
    });
}

function initWithErrors(callback) {
    init(function(err, opts) {
        if (err) {
            return exitWithError(err.message);
        }
            
        callback(opts);
    });
}

function onDone(err, data) {
    if (err) {
        return exitWithError(err.message);   
    }

    if (data && _.isString(data)) {
        process.stdout.write(data);
    }
    
    process.exit(0);
}

var commands = {
    run: function run() {
        var testFilter = argv.testname || argv._[1];

        if (!testFilter) {
            return exitWithError(util.format(
                '\n%s\n%s',
                'No test name specified. Try specifying a name:',
                'grandma run <testname>'
            ));
        }
        
        if (!argv.rate && !argv.concurrent) {
            return exitWithError(util.format(
                '\n%s\n%s',
                'Either --rate or --concurrent must be specified. See for more help:',
                'grandma run --help'
            ));
        }

        initWithErrors(function(opts) {
            opts.output = getDestinationStream(opts);

            opts.tests = _.filter(opts.tests, function(test) {
                return test.name === testFilter;
            });

            grandma.run(opts, onDone);
        });
    },
    list: function list() {
        // :)
        function leftPad(v) {
            return '  ' + v;
        }

        initWithErrors(function(opts) {
            grandma.list(opts, function(err, list) {
                if (err) {
                    return onDone(err.message);
                }

                var str = util.format(
                    '\n%s\n\n%s\n\n%s\n',
                    'The following tests are available:',
                    list.map(leftPad).join('\n'),
                    'Run as: grandma run <testname> [options]'
                );

                onDone(undefined, str);
            });
        });
    },
    report: function report() {
        var glob = argv.glob || argv._[1];

        if (!glob) {
            glob = 'stdin';
        }

        var opts = _.clone(argv);

        opts.input = getInputStream(glob);
        opts.output = getDestinationStream(opts);

        grandma.report(opts, onDone);
    },
    help: function help() {
        argv._yargs.showHelp();
        onDone(undefined, '');
    }
};

function loadConfig() {
    var opts = rc('grandma');
    argv = require('../lib/argv.js')(opts);
    return argv;
}

function runCommand() {
    var command = argv._[0] || 'help';
    
    var commandList = ['run', 'report', 'list'];
    var errorMsg = 'Available commands: ' + commandList.join(', ');
    
    if (command === undefined) {
        return exitWithError('command is not defined\n' + errorMsg);
    }
    
    if (commands[command]) {
        commands[command]();
    } else {
        exitWithError('command "' + command + '" is not known\n' + errorMsg);
    }
}

loadConfig();
runCommand();
