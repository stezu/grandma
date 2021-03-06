/* jshint node: true */

var path = require('path');

var run = require('./lib/run');
var list = require('./lib/list');
var report = require('./lib/report');

module.exports = {
    run: run,
    list: list,
    report: report,
    cliPath: function() {
        return path.resolve(__dirname, 'lib/cli');
    }
};
