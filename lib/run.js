/* jshint node: true */

var _ = require('lodash');
var async = require('async');
var Duration = require('duration-js');

var forkmaster = require('./forkmaster');

function validateNumberProp(opts, prop) {
    if (opts[prop] !== undefined && (!_.isNumber(opts[prop]) || opts[prop] === 0)) {
        throw new Error(prop + ' is invalid');
    }
}

function validateOpts(options) {
    // really, this should be using garry,
    // but it is not written yet
    
    var durationIsValidString = _.isString(options.duration) && /\d+(ms|[smhdw])$/.test(options.duration);
    var durationIsNumber = _.isNumber(options.duration);
    if (durationIsValidString || durationIsNumber) {
        options.duration = (new Duration(options.duration)).milliseconds();
    } else {
        throw new Error(options.duration === undefined ?
            'duration is not defined' :
            'duration is invalid');
    }
    
    if (options.rate === undefined && options.concurrent === undefined) {
        throw new Error('either options.rate or options.concurrent is required');
    }
    
    validateNumberProp(options, 'rate');
    validateNumberProp(options, 'concurrent');

    if (options.concurrent) {
        delete options.rate;
    }

    if (options.rate < 0 || Math.floor(options.rate * (options.duration / 1000)) < 1) {
        throw new Error('duration is too low');
    }
    
    return options;
}

function run(options, callback) {
    
    try {
        options = validateOpts(options);
    } catch(e) {
        return async.setImmediate(callback.bind(undefined, e));
    }
    
    var testsToRun = options.tests.map(function(opts) {
        return function runSingleTest(done) {
            forkmaster(
                _.merge({
                    filepath: opts.path,
                    // set default values
                    threads: 1
                }, options),
                done
            );
        };
    });
    
    async.series(testsToRun, function() {
        callback();
    });
}

module.exports = run;
