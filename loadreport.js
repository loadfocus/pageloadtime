var fs = require('fs');
var webpage = require('webpage');
var system = require('system');

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 50000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    sleep(2000);
		    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

function Stats(arr) {
	var self = this;
	var theArray = arr || [];

	//http://en.wikipedia.org/wiki/Mean#Arithmetic_mean_.28AM.29
	self.getArithmeticMean = function() {
		var sum = 0, length = theArray.length;
		for(var i=0;i<length;i++) {
		sum += theArray[i];
		}
		return sum/length;
	}

	//http://en.wikipedia.org/wiki/Mean#Geometric_mean_.28GM.29
	self.getGeometricMean = function() {
		var product = 1, length = theArray.length;
		for(var i=0;i<length;i++) {
		product = product * theArray[i];
		}
		return Math.pow(product,(1/length));
	}

	//http://en.wikipedia.org/wiki/Mean#Harmonic_mean_.28HM.29
	self.getHarmonicMean = function() {
		var sum = 0, length = theArray.length;
		for(var i=0;i<length;i++) {
		sum += (1/theArray[i]);
		}
		return length/sum;
	}

	//http://en.wikipedia.org/wiki/Standard_deviation
	self.getStandardDeviation = function() {
		var arithmeticMean = this.getArithmeticMean();
		var sum = 0, length = theArray.length;
		for(var i=0;i<length;i++) {
		sum += Math.pow(theArray[i]-arithmeticMean, 2);
		}
		return Math.pow(sum/length, 0.5);
	}

	//http://en.wikipedia.org/wiki/Median
	self.getMedian = function() {
		var length = theArray.length;
		var middleValueId = Math.floor(length/2);
		var arr = theArray.sort(function(a, b){return a-b;});
		return arr[middleValueId];
	}

	//http://en.wikipedia.org/wiki/Median
	self.get90Percentile = function() {
		var length = theArray.length;
		var percentileValueId = Math.floor(length*0.9);
		var arr = theArray.sort(function(a, b){return a-b;});
		return arr[percentileValueId];
	}

	self.setArray = function(arr) {
		theArray = arr;
		return self;
	}
	self.getArray = function() {
		return theArray;
	}

	return self;
}

var loadreport = {

    run: function () {
            var cliConfig = {};
            loadreport.performancecache = this.clone(loadreport.performance);


	    var contract = [
                {
                    name: 'url',
                    def: 'http://google.com',
                    req: true,
                    desc: 'the URL of the site to load test'
                }, {
                    name: 'task',
                    def: 'performance',
                    req: false,
                    desc: 'the task to perform',
                    oneof: ['performance', 'performancecache', 'filmstrip']
                }, {
                    name: 'configFile',
                    def: 'config.json',
                    req: false,
                    desc: 'a local configuration file of further loadreport settings'
                }
            ];

	    if (!this.processArguments(cliConfig, contract)) {
                return;
            }

            this.config = this.mergeConfig(cliConfig, cliConfig.configFile);
            var task = this[this.config.task];
            this.load(this.config, task, this);
    },

    performance: {
        resources: [],
        timer : 0,
        evalConsole : {},
        evalConsoleErrors : [],
	xhrcalls: [],

	onInitialized: function(page, config) {
            var pageeval = page.evaluate(function(startTime) {
                var now = new Date().getTime();
                //check the readystate within the page being loaded

                //Returns "loading" while the document is loading
                var _timer3=setInterval(function(){
                    if(/loading/.test(document.readyState)){
                        console.log('loading-' + (new Date().getTime() - startTime));
                        //don't clear the interval until we get last measurement
                        var loadTimeCurr = new Date().getTime();
			console.log(loadTimeCurr - now);
			if ((loadTimeCurr - now) > 60000){
                            clearInterval(_timer3);
		            phantom.exit();
                        }
                    }
                }, 5);

                // "interactive" once it is finished parsing but still loading sub-resources
                var _timer1=setInterval(function(){
                    if(/interactive/.test(document.readyState)){
                        console.log('interactive-' + (new Date().getTime() - startTime));
                        clearInterval(_timer1);
                        //clear loading interval
                        clearInterval(_timer3);
                    }
                }, 5);

                //"complete" once it has loaded - same as load event below
                // var _timer2=setInterval(function(){
                //     if(/complete/.test(document.readyState)){
                //         console.log('complete-' + (new Date().getTime() - startTime));
                //         clearInterval(_timer2);
                //     }
                // }, 5);

                //The DOMContentLoaded event is fired when the document has been completely
                //loaded and parsed, without waiting for stylesheets, images, and subframes
                //to finish loading
                document.addEventListener("DOMContentLoaded", function() {
                    console.log('DOMContentLoaded-' + (new Date().getTime() - startTime));
                }, false);

                //detect a fully-loaded page
                window.addEventListener("load", function() {
                    console.log('onload-' + (new Date().getTime() - startTime));
                }, false);

                //check for JS errors
                window.onerror = function(message, url, linenumber) {
                    console.log("jserror-JavaScript error: " + message + " on line " + linenumber + " for " + url);
                };
            },this.performance.start);
        },
        onLoadStarted: function (page, config) {
            if (!this.performance.start) {
                this.performance.start = new Date().getTime();
            }
        },
        onResourceRequested: function (page, config, request) {
            var now = new Date().getTime();
            var isXhr = false;

            this.performance.resources[request.id] = {
                id: request.id,
                url: request.url,
                request: request,
                responses: {},
                duration: '',
                times: {
                    request: now
                }
            };
            if (!this.performance.start || now < this.performance.start) {
                this.performance.start = now;
            }


            // set if XHR call
	    request.headers.forEach(function(header){
	    	if ((header.name.toLowerCase()=='x-requested-with') && (header.value.toLowerCase()=='xmlhttprequest')){
			isXhr = true;
			console.log("XHR " + request.url);
		}
            });
            if (isXhr){
	            this.performance.xhrcalls.push(request.url);
            }

	    console.log("Request URL : " + request.url);
		console.log('Request (#' + request.id + '): ' + JSON.stringify(request));


        },
        onResourceReceived: function (page, config, response) {
            var now = new Date().getTime(),
                resource = this.performance.resources[response.id];
            resource.responses[response.stage] = response;

            if (response.stage === 'start') {
                resource.startReply = response;
            }
            if (response.stage === 'end') {
                resource.endReply = response;
            }

            if (!resource.times[response.stage]) {
                resource.times[response.stage] = now;
                resource.duration = now - resource.times.request;
            }
            if (response.bodySize) {
		resource.size = response.bodySize;

            } else if (!resource.size) {
                response.headers.forEach(function (header) {
                    if (header.name.toLowerCase()=='content-length' && header.value != 0) {
                        resource.size = parseInt(header.value);
		    }
                });
            }
	console.log("Url :" + response.url);
	console.log("Body size " + response.bodySize);

	response.headers.forEach(function (header) {
                    console.log(header.name + ":" + header.value);
                });

        },
        onLoadFinished: function (page, config, status) {
            var start = this.performance.start,
                finish =  new Date().getTime(),
                resources = this.performance.resources,
                slowest, fastest, totalDuration = 0,
                largest, smallest, totalSize = 0,
                missingList = [],
                missingSize = false,
                elapsed = finish - start,
                now = new Date();
		if (status !== 'success') {
	            console.log("FAIL");
	            return;
	        }

            resources.forEach(function (resource) {
                if (!resource.times.start) {
                    resource.times.start = resource.times.end;
                }
                if (!slowest || resource.duration > slowest.duration) {
                    slowest = resource;
                }
                if (!fastest || resource.duration < fastest.duration) {
                    fastest = resource;
                }

		if (!isNaN(resource.duration) && (resource.duration != null) && resource.duration != ""){
		totalDuration = totalDuration + parseInt(resource.duration);
		}

                if ((resource.size!=undefined) && (resource.size!=0)) {
                    if (!largest || resource.size > largest.size) {
                        largest = resource;
                    }
                    if (!smallest || resource.size < smallest.size) {
                        smallest = resource;
                    }

                    totalSize += resource.size;
                } else {
                    resource.size = 0;
                    missingSize = true;
                    missingList.push(resource.url);
                }

            });


            if (config.verbose) {
                console.log('');
                this.emitConfig(config, '');
            }

            var report = {};
            report.url = system.args[0];
            report.phantomCacheEnabled = system.args.indexOf('yes') >= 0 ? 'yes' : 'no';
            report.taskName = config.task;
            var drsi = parseInt(this.performance.evalConsole.interactive);
            var drsl = parseInt(this.performance.evalConsole.loading);
            var wo = parseInt(this.performance.evalConsole.onload);
            // var drsc = parseInt(this.performance.evalConsole.complete);

            report.domReadystateLoading = isNaN(drsl) == false ? drsl : 0;
            report.domReadystateInteractive = isNaN(drsi) == false ? drsi : 0;
            // report.domReadystateComplete = isNaN(drsc) == false ? drsc : 0;
            report.windowOnload = isNaN(wo) == false ? wo : 0;

            report.elapsedLoadTime = elapsed;
            report.numberOfResources = resources.length-1;
            report.totalResourcesTime = totalDuration;
            report.slowestResource = slowest.url;
            report.largestResource = largest.url;
            report.totalResourcesSize = (totalSize / 1000);
            report.nonReportingResources = missingList.length;
            report.nonReportingResourcesList = missingList;
            report.timeStamp = now.getTime();
            report.date = now.getDate() + "/" + now.getMonth() + "/" + now.getFullYear();
            report.time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
            report.errors = this.performance.evalConsoleErrors;
            report.xhrcalls = this.performance.xhrcalls;
	    report.resource = [];
	    resources.forEach(function (resource) {
		    var object = new Object();
                    object.url = resource.url;
                    object.size = resource.size;
                    report.resource.push(object);
                });


            console.log('Elapsed load time: ' + this.pad(elapsed, 6) + 'ms');

            if(system.args.indexOf('csv') >= 0){
                this.printToFile(config,report,'loadreport','csv',system.args.indexOf('wipe') >= 0);
            }

            if(system.args.indexOf('json') >= 0){
                this.printToFile(config,report,'loadreport','json',system.args.indexOf('wipe') >= 0);
            }
            console.log('Finished');
        }


    },

    getFinalUrl: function (page) {
        return page.evaluate(function () {
            return document.location.toString();
        });
    },

    emitConfig: function (config, prefix) {
        console.log(prefix + 'Config:');
        for (key in config) {
            if (config[key].constructor === Object) {
                if (key===config.task) {
                    console.log(prefix + ' ' + key + ':');
                    for (key2 in config[key]) {
                        console.log(prefix + '  ' + key2 + ': ' + config[key][key2]);
                    }
                }
            } else {
                console.log(prefix + ' ' + key + ': ' + config[key]);
            }
        }
    },

    load: function (config, task, scope) {
        var page = webpage.create(),
            pagetemp = webpage.create(),
            event;

        if (config.userAgent && config.userAgent != "default") {
            if (config.userAgentAliases[config.userAgent]) {
                config.userAgent = config.userAgentAliases[config.userAgent];
            }
            page.settings.userAgent = config.userAgent;
	    page.settings.userAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:20.0) Gecko/20100101 Firefox/20.0";
	    page.settings.loadPlugins = true;
        }
        var eventHandlers = ['onInitialized', 'onLoadStarted', 'onResourceRequested', 'onResourceReceived'];
        eventHandlers.forEach(function (event) {
            if (task[event]) {
                page[event] = function () {
                    var args = [page, config],
                        a, aL;
                    for (a = 0, aL = arguments.length; a < aL; a++) {
                        args.push(arguments[a]);
                    }
                    task[event].apply(scope, args);
                };

            }
        });
        if (task.onLoadFinished) {
            page.onLoadFinished = function (status) {
                if (config.wait) {
                    setTimeout(
                        function () {
                            task.onLoadFinished.call(scope, page, config, status);
                        },
                        config.wait
                    );
                } else {
                    task.onLoadFinished.call(scope, page, config, status);
                }
                //phantom.exit();
waitFor(function() {
					    // Check in the page if a specific element is now visible
					    return page.evaluate(function() {
						return (document.readyState == 'complete');
					    });
					}, function() {
					   console.log("Document ready");
					   phantom.exit();
					});

                page = webpage.create();
                doPageLoad();
            };
        } else {
            page.onLoadFinished = function (status) {
	waitFor(function() {
					    // Check in the page if a specific element is now visible
					    return page.evaluate(function() {
						return (document.readyState == 'complete');
					    });
					}, function() {
					   console.log("Document ready");
					   phantom.exit();
					});
                //phantom.exit();
            };
        }
        page.settings.localToRemoteUrlAccessEnabled = true;
        page.settings.webSecurityEnabled = false;
        page.onConsoleMessage = function (msg) {
            console.log(msg)
            if (msg.indexOf('jserror-') >= 0){
                loadreport.performance.evalConsoleErrors.push(msg.substring('jserror-'.length,msg.length));
            }else{
                if (msg.indexOf('loading-') >= 0){
                    loadreport.performance.evalConsole.loading = msg.substring('loading-'.length,msg.length);
                } else if (msg.indexOf('interactive-') >= 0){
                    loadreport.performance.evalConsole.interactive = msg.substring('interactive-'.length,msg.length);
                // } else if (msg.indexOf('complete-') >= 0){
                //     loadreport.performance.evalConsole.complete = msg.substring('complete-'.length,msg.length);
                } else if (msg.indexOf('onload-') >= 0){
                    loadreport.performance.evalConsole.onload = msg.substring('onload-'.length,msg.length);
                }
                //loadreport.performance.evalConsole.push(msg);
            }
        };

        page.onError = function (msg, trace) {
            //console.log("+++++  " + msg);
            trace.forEach(function(item) {
                loadreport.performance.evalConsoleErrors.push(msg + ':' + item.file + ':' + item.line);
            })
        };

        function doPageLoad(){
            setTimeout(function(){
                page.open(config.url, function(status){
                                        if (status !== 'success') {
                                                console.log("FAIL:" + status);
                                                phantom.exit(1);
                                            }
					else{
					// Wait for 'signin-dropdown' to be visible
					waitFor(function() {
					    // Check in the page if a specific element is now visible
					    return page.evaluate(function() {
						return (document.readyState == 'complete');
					    });
					}, function() {
					   console.log("Document ready");
					   //phantom.exit();
					});
									}
		        		});},config.cacheWait);
        }

        if(config.task == 'performancecache'){

            pagetemp.open(config.url,function(status) {
                if (status === 'success') {
                    pagetemp.release();
                    doPageLoad();
                }
            });
        }else{
            doPageLoad();
        }
    },

    processArguments: function (config, contract) {
        var i = 1;
        var ok = true;

        contract.forEach(function(argument) {
            if (i < system.args.length) {
                config[argument.name] = system.args[i];
            } else {
                if (argument.req) {
                    console.log('"' + argument.name + '" argument is required. This ' + argument.desc + '.');
                    ok = false;
                } else {
                    config[argument.name] = argument.def;
                }
            }
            if (argument.oneof && argument.oneof.indexOf(config[argument.name])==-1) {
                console.log('"' + argument.name + '" argument must be one of: ' + argument.oneof.join(', '));
                ok = false;
            }
            i++;
        });
        return ok;
    },

    mergeConfig: function (config, configFile) {
        if (!fs.exists(configFile)) {
            configFile = "loadreport/config.json";
        }
        if (!fs.exists(configFile)) {
            configFile = "config.json";
        }
        var result = JSON.parse(fs.read(configFile)),
            key;
        for (key in config) {
            result[key] = config[key];
        }
        return result;
    },

    truncate: function (str, length) {
        length = length || 80;
        if (str.length <= length) {
            return str;
        }
        var half = length / 2;
        return str.substr(0, half-2) + '...' + str.substr(str.length-half+1);
    },

    pad: function (str, length) {
        var padded = str.toString();
        if (padded.length > length) {
            return this.pad(padded, length * 2);
        }
        return this.repeat(' ', length - padded.length) + padded;
    },

    repeat: function (chr, length) {
        for (var str = '', l = 0; l < length; l++) {
            str += chr;
        }
        return str;
    },

    clone: function(obj) {
        var target = {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                target[i] = obj[i];
            }
        }
        return target;
    },

    timerStart: function () {
        return (new Date()).getTime();
    },

    timerEnd: function (start) {
        return ((new Date()).getTime() - start);
    },

    printToFile: function(config,report,filename,extension,createNew) {
        var f, myfile,
            keys = [], values = [];
        for(var key in report)
        {
            if(report.hasOwnProperty(key))
            {
                keys.push(key);
                values.push(report[key]);
            }
        }
        if(system.args[3] && system.args[3] != 'wipe'){
            myfile = 'reports/' + filename + '-' + system.args[3] + '.' + extension;
        }else{
            myfile = 'reports/' + filename + '.' + extension;

        }

        if(!createNew && fs.exists(myfile)){
            //file exists so append line
            try{
                if(extension === 'json'){
                    var phantomLog = [];
                    var tempLine = JSON.parse(fs.read(myfile));
                    if(Object.prototype.toString.call( tempLine ) === '[object Array]'){
                        phantomLog = tempLine;
                    }
                    phantomLog.push(report);
                    fs.remove(myfile);
                    f = fs.open(myfile, "w");
                    f.writeLine(JSON.stringify(phantomLog));
                    f.close();
                }else{
                    f = fs.open(myfile, "a");
                    f.writeLine(values);
                    f.close();
                }

            } catch (e) {
                console.log("problem appending to file",e);
            }
        }else{
            if(fs.exists(myfile)){
                fs.remove(myfile);
            }
            //write the headers and first line
            try {
                f = fs.open(myfile, "w");
                if(extension === 'json'){
                    f.writeLine(JSON.stringify(report));
                }else{
                    f.writeLine(keys);
                    f.writeLine(values);
                }
                f.close();
            } catch (e) {
                console.log("problem writing to file",e);
            }
        }
    }

};

loadreport.run();
