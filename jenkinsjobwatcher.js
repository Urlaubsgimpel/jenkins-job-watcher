var util = require('util');
var EventEmitter = require('events').EventEmitter;
var jenkinsApi = require('jenkins-api');

/**
 * Creates a new JenkinsJobWatcher. It will perform the defined
 * checks periodically and emit events accordingly.
 * @param {object} options The options.
 * @param {string} options.jenkinsUrl The base URL of the Jenkins server.
 * @param {number} options.checkInterval The interval (ms) for fetching the Jenkins status.
 * @param {number} options.maximumRetries The maximum number of retries to reach the Jenkins (-1 for infinite).
 * @param {boolean} [options.stopAfterOnePositiveCheck=false] If set to true, no other checks
 * will be executed after one check was successful.
 * @param {boolean} [options.onlyNotifyOnChange=false] If set to true, the 'checkPositive' event will be fired
 * only when the status has changed since the last check.
 * @param {string[]} [options.watchedJobs] A white list of Jenkins jobs to watch. If none are provided,
 * all jobs will be watched.
 * @param {object[]} options.checks An array containing all the checks to perform. A check has an ID and
 * multiple and-joined conditions. Conditions have a scope ('all' or 'one') and a list of Jenkins statuses. Like this:
 * {
 *     "id": "Ok and Building A Job",
 *     "conditions": [
 *         {
 *             "scope": "one",
 *             "status": [
 *                 "blue_anime",
 *                 "grey_anime",
 *                 "notbuilt_anime",
 *                 "aborted_anime",
 *                 "disabled_anime"
 *             ]
 *         },
 *         {
 *             "scope": "all",
 *             "status": [
 *                 "blue",
 *                 "notbuilt",
 *                 "aborted",
 *                 "grey",
 *                 "disabled",
 *                 "blue_anime",
 *                 "grey_anime",
 *                 "notbuilt_anime",
 *                 "aborted_anime",
 *                 "disabled_anime"
 *             ]
 *         }
 *     ]
 * }
 * @constructor
 */
var JenkinsJobWatcher = function (options) {

    var self = this;
    var retries = 0;
    var timeout = null;
    var lastNotifiedCheckId = null;
    var jenkins = jenkinsApi.init(options.jenkinsUrl);

    /**
     * Starts the watcher. It will start checking the Jenkins periodically
     * and emitting events based on the check results.
     */
    this.start = function () {
        checkJenkins();
    };

    /**
     * Stops the watcher. It is safe to call start again to resume the watcher.
     */
    this.stop = function () {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = null;
        retries = 0;
        lastNotifiedCheckId = null;
    };

    var checkJenkins = function () {
        jenkins.all_jobs(function jenkinsCallback(err, jobs) {
            if (err) {
                self.emit('error', err);
                retries++;
            } else {
                retries = 0;
                processChecks(jobs);
            }
            if (options.maximumRetries === -1 || retries <= options.maximumRetries) {
                timeout = setTimeout(checkJenkins, options.checkInterval);
            } else {
                self.emit('error', 'Exiting after ' + (retries - 1) + ' retries.');
            }
        });
    };

    var processChecks = function (jobs) {
        if (jobs.length === 0) return;
        var statuses = buildStatusMap(jobs);
        for (var i = 0; i < options.checks.length; i++) {
            var check = options.checks[i];
            var checkPositive = performCheck(check, statuses);
            if (checkPositive) {
                executeCheck(check);
                if (options.stopAfterOnePositiveCheck) {
                    break;
                }
            } else {
                self.emit('checkNegative', check);
            }
        }
    };

    var buildStatusMap = function (jobs) {
        var statuses = {};
        statuses._sum = 0;
        for (var i = 0; i < jobs.length; i++) {
            var job = jobs[i];
            if (options.watchedJobs && options.watchedJobs.indexOf(job.name) === -1) continue;
            if (!statuses.hasOwnProperty(job.color)) {
                statuses[job.color] = [];
            }
            statuses[job.color].push(job.name);
            statuses._sum++;
        }
        return statuses;
    };

    var performCheck = function (check, statuses) {
        for (var i = 0; i < check.conditions.length; i++) {
            var condition = check.conditions[i];
            if ((condition.scope === 'all' && !checkForAll(condition, statuses)) ||
                (condition.scope === 'one' && !checkForOne(condition, statuses))) {
                return false;
            }
        }
        return true;
    };

    var checkForAll = function (condition, statuses) {
        var sum = 0;
        for (var i = 0; i < condition.status.length; i++) {
            var status = condition.status[i];
            if (statuses.hasOwnProperty(status)) {
                sum += statuses[status].length;
            }
        }
        return sum === statuses._sum;
    };

    var checkForOne = function (condition, statuses) {
        for (var i = 0; i < condition.status.length; i++) {
            var status = condition.status[i];
            if (statuses.hasOwnProperty(status)) {
                if (condition.pattern) {
                    for (var j = 0; j <= statuses[status].length; j++) {
                        if (condition.pattern.test(statuses[status][j])) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    return true;
                }
            }
        }
        return false;
    };

    var executeCheck = function (check) {
        if (options.onlyNotifyOnChange) {
            if (lastNotifiedCheckId !== check.id) {
                self.emit('checkPositive', check);
                lastNotifiedCheckId = check.id;
            } else {
                self.emit('checkSame', check);
            }
        } else {
            self.emit('checkPositive', check);
        }
    };

};

util.inherits(JenkinsJobWatcher, EventEmitter);
module.exports = JenkinsJobWatcher;
