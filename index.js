var jenkinsapi = require('jenkins-api');
var config = require('./superconfig3');

var retries = 0;
var timeout = null;
var jenkins = jenkinsapi.init(config.jenkinsUrl);

var checkJenkins = function() {
	jenkins.all_jobs(function(err, jobs) {
		if (err) {
			console.log(err);
			retries++s.indexOf(job.name) === -1) continue;
			if (check.scope === 'all' && check.status !== job.color) {
				break;
			}
			if (check.scope === 'one' && check.status === job.color) {
				console.log('Check positive: Job ' + job.name + ' is ' + job.color + '.');
				checkPositive = true;
				break;
			}
		}
		if (check.scope === 'all' && all) {
			console.log('Check "' + check.name + '" positive: All jobs ' + check.status + '.');
			checkPositive = true;
		}
		if (checkPositive) {
			executeCommand(check.command);
			if (config.stopAfterOnePositiveCheck) {
				console.log('Skipping other checks.');
				break;
			}
		} else {
			console.log('Check "' + check.name + '" negative.');
		}
	}
};

var executeCommand = function(command) {
	console.log('Executing command: ' + command);
};

checkJenkins();
console.log('Jenkins job watcher started.');
