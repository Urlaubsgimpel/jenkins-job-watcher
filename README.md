# jenkins-job-watcher

Use the JenkinsJobWatcher class to watch the status of your Jenkins jobs. You are able to provide your own check conditions and get notified if a check is positive.

## Install

	npm install --save jenkins-job-watcher

## Usage

This is an example call with all possible options:

	var JenkinsJobWatcher = require('jenkins-job-watcher');
	
    var jobWatcher = new JenkinsJobWatcher({
        "jenkinsUrl": "http://localhost:8080/",
        "checkInterval": 5000,
        "maximumRetries": -1,
        "stopAfterOnePositiveCheck": true,
        "onlyNotifyOnChange": true,
        "watchedJobs": [
            "Test"
        ],
        "checks": [
            {
                "id": "Building A Job",
                "conditions": [
                    {
                        "scope": "one",
                        "status": [
                            "red_anime",
                            "blue_anime",
                            "yellow_anime",
                            "grey_anime",
                            "notbuilt_anime",
                            "aborted_anime",
                            "disabled_anime"
                        ]
                    }
                ]
            },
            {
                "id": "Failed",
                "conditions": [
                    {
                        "scope": "one",
                        "status": [
                            "red",
                            "yellow"
                        ]
                    }
                ]
            },
            {
                "id": "Ok",
                "conditions": [
                    {
                        "scope": "all",
                        "status": [
                            "blue",
                            "notbuilt",
                            "aborted",
                            "grey",
                            "disabled"
                        ]
                    }
                ]
            }
        ]
    });

You can define multiple conditions per check. The check is considered true only if all of its containing conditions are true. The checks are executed in the order they were defined.

## Events

The JenkinsJobWatcher is also an EventEmitter and emits the following events:

* __checkPositive__
Emitted when a check is true. The argument of the event is the corresponding check object.
* __checkSame__
Emitted when the option "onlyNotifyOnChange" is set to true and the check still evaluates to true. The argument of the event is the corresponding check object.
* __checkNegative__
Emitted when a check is false. The argument of the event is the corresponding check object.
* __error__
Emitted when an error occurred. The argument of the event is the error.
