var exec = require('child_process');
var jenkinsapi = require('jenkins-api');
var config = require('./config');

var retries = 0;
var timeout = null;
var lastExecutedCheckId = null;
var jenkins = jenkinsapi.init(config.jenkinsUrl);

var checkJenkins = function() {
	jenkins.all_jobs(function(err, jobs) {
		if (err) {
			console.log(err);
			retries++;
		} else {
			retries = 0;
			processChecks(jobs);
		}
		if (config.maximumRetries === -1 || retries <= config.maximumRetries) {
			timeout = setTimeout(checkJenkins, config.checkInterval);
		} else {
			console.log('Exiting after ' + (retries - 1) + ' retries.');
		}
	});
};

var processChecks = function(jobs) {
	if (jobs.length === 0) return;
	
	for (var i = 0; i < config.checks.length; i++) {
		var check = config.checks[i];
		var checkPositive = false;
		var all = true;
		for (var j = 0; j < jobs.length; j++) {
			var job = jobs[j];
			if (config.watchedJobs && config.watchedJobs.indexOf(job.name) === -1) continue;
			if (check.scope === 'all' && check.status.indexOf(job.color) === -1) {
				all = false;
				break;
			}
			if (check.scope === 'one' && check.status.indexOf(job.color) > -1) {
				console.log('Check positive: Job ' + job.name + ' is ' + job.color + '.');
				checkPositive = true;
				break;
			}
		}
		if (check.scope === 'all' && all) {
			console.log('Check "' + check.id + '" positive: All jobs ' + check.status + '.');
			checkPositive = true;
		}
		if (checkPositive) {
			if (config.onlyExecuteCommandOnChange) {
				if (lastExecutedCheckId !== check.id) {
					executeCommand(check.command);
					lastExecutedCheckId = check.id;
				}
			} else {
				executeCommand(check.command);
			}
			if (config.stopAfterOnePositiveCheck) {
				console.log('Skipping other checks.');
				break;
			}
		} else {
			console.log('Check "' + check.id + '" negative.');
		}
	}
};

var executeCommand = function(command) {
	console.log('Executing command: ' + command);

};

if (config.startupCommand) {
	executeCommand(config.startupCommand);
}
checkJenkins();
console.log('Jenkins job watcher started.');
