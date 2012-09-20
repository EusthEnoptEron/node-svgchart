//Load libs
var jsdom        = require("jsdom")
	, path       = require("path")
	, Contextify = require('contextify')
	, spawn       = require('child_process').spawn
	, crypto     = require('crypto')
	, fs         = require("fs")
	, svgp       = require("./node-svgchart/svg")
	, domparser  = require("./node-svgchart/domparser")
	, _          = require("underscore")
	, domToHtml  = require('./node-svgchart/domtohtml').domToHtml
	, EventEmitter = require("events").EventEmitter;


function NodeChart() {
	EventEmitter.call(this);

	//List of dependencies
	var dependencies = [];

	//Function to set up chart.
	var setup = function(e, callback) {callback()};

	var window = null
	, self = this
	, queue = []
	, width = null
	, height = null
	, safeMode = false
	, timeouts = [];

	function next() {
		queue.shift();
		self.clearTimeouts();
		if(queue.length) {
			queue[0]();
		}
	}

	/**
	 * Converts an object to a list of arguments
	 * @param  {object} obj [description]
	 * @return {[type]}
	 */
	function objectToArgs(obj) {
		var args = [];

		if(obj.width || obj.height) {
			args.push('-resize');
			var resize = 'x';
			if(obj.width) {
				resize = obj.width + resize;
			}
			if(obj.height) {
				resize += obj.height;
			}
			args.push(resize);
		}

		return args;
	}

	function updateSize() {

		var chart = window.document.getElementById("chart");
		if(chart) {
			if(height) {
				chart.height = height;
				chart.style.height = height + "px";
			}
			if(width) {
				chart.width  = width;
				chart.style.width = width + "px";
			}
		}

	}

	/**
	 * Registers a JavaScript File to be loaded when generating a chart.
	 * @param {string} path Path to the lib file
	 */
	this.require = function(dep) {
		if(!(dep instanceof Array)) {
			dep = [dep];
		}


		dep.forEach(function(el) {
			//Store absolute path.
			dependencies.push(path.resolve(el));
		});

		return this;
	}

	/**
	 * Rewrite a font as a different font.
	 * @param {[type]} font    [description]
	 * @param {[type]} rewrite [description]
	 */
	this.setFont = function(font, rewrite) {

		return this;
	}

	this.setSafeMode = function(on) {
		safeMode = on;
	}

	/**
	 * Set width and height of the chart container.
	 * @param {int} w Width in pixels
	 * @param {int} h Height in pixels
	 */
	this.setSize = function(w, h) {
		width = w;
		height = h;

		if(window) {
			//Update if necessary.
			updateSize();
		}

		return this;
	}

	/**
	 * Clears all current timeouts in window.
	 * @return {[type]} [description]
	 */
	this.clearTimeouts = function() {
		if(window) {
			while(timeouts.length) {
				var to = timeouts.shift();
				//We naively clear both for simplicity's sake.
				window.clearTimeout(to);
				window.clearInterval(to);
			}
		}
	}

	/**
	 * Assign a function that kicks the chart up. The chart has to be written to #chart
	 * @param  {Function} callback Function that set the chart up.
	 */
	this.setup = function(callback) {
		setup = callback;
		return this;
	}

	/**
	 * Sets up the environment. Use this when in a server context.
	 * @return {[type]} [description]
	 */
	this.start = function(callback) {
		callback = callback || function() {};
		if(!window) {
			//Simulate browser.
			jsdom.env({
				//Minimalisic web page
				html: '<html><body><div id="chart"></div></body></html>',
				done: function(err, w) {
					if(err) {
						callback(err);
						return;
					}

					//Apply some patches.
					svgp.patch(w);
					domparser.patch(w);
					w.console = console;

					/////////////////////////////
					// BUGFIX for Highcharts
					// -> They define a timeout for tooltips, which would keep node alive.
					//    Therefore, we keep track of the timeouts and intervals and clear them afterwards.
					////////////////////////////
					//
					//Store original
					var wSetTimeout  = w.setTimeout,
						wSetInterval = w.setInterval;
					w.setTimeout = function(func, time) {
						var id = wSetTimeout.call(this, func, time);
						timeouts.push(id);
						return id;
					};

					w.setInterval = function(func, time) {
						var id = wSetInterval.call(this, func, time);
						timeouts.push(id);
						return id;
					}

					/////////////////////////////
					// BUGFIX for Highcharts
					// -> They access "hostname" for some reason, which is not implemented
					//    by jsdom at this point.
					/////////////////////////////
					
					w.location.__defineGetter__("hostname", function() {
				      return '';
				    });
				    w.location.__defineGetter__("host", function() {
				      return '';
				    });

					w.NodeArray = Array;

					/* PROBLEM
					w.run("function test(arr) {console.log(arr instanceof Array, [] instanceof Array)}");
					w.test([]);
					 */
					//w.Array.prototype.__dummy__array__ = Array.prototype.__dummy__array__ = true;
					
					dependencies.forEach(function(scriptName) {
						//Change the code to make
						//	a instanceof Array
						//	-->
						//	(a instanceof Array || a instanceof NodeArray)
						//Definitely a risky and ugly approach, but didn't find another workaround for this problem.
						//See PROBLEM for an example.
						script = fs.readFileSync(scriptName).toString();
						if(!safeMode)
							script = script.replace(/([\w.\[\]"']+)\s*instanceof\s*Array/g, "($1 instanceof Array || $1 instanceof NodeArray)");

						//fs.writeFile(scriptName + "2", script);
						w.run(script);
					});
					window = w;


					self.emit("ready", window);
					callback(null, window);

				}

			});
		} else {
			callback(null, window);
			self.emit("ready", window);
		}

		return this;
	}

	/**
	 * Tear down the DOM environment.
	 * @return {[type]} [description]
	 */
	this.stop = function() {
		window.dispose();
		window = null;
		queue = [];
	};



	this.create = function(jobName, options, callback) {
		var set = setup;
		queue.push(function() {
			if(!callback) callback = function() {};
			self.start(function(err) {
				if(err) {
					callback(err);
					next();
					return;
				}


				/*
				var ch = window.document.getElementById("chart");
				var chn = window.document.createElement("div");
				chn.id = "chart";

				window.document.body.removeChild(ch);
				window.document.body.appendChild(chn);*/

				//Create our little DOM-world
				set.call(window, {job: jobName,
									window: window},

				function() {				
					//Get generated SVG.
					var svg = window.document.getElementsByTagName("SVG");

					if(svg.length) {
						svg = domToHtml(svg[0]);
						svg = svgp.clean(svg);


						var e = { svg: svg
								, stop: false
								, job: jobName };
						self.emit("svg", e);
						//We got what we need.
						next();

						if(!e.stop) {
							//console.log(['svg:-', 'png:-'].concat(objectToArgs(options)));
							// Start convert
							convert	= spawn('convert', objectToArgs(options).concat(['-background', 'none', 'svg:-', 'png:-']));

							convert.stdin.write(svg);
							convert.stdin.end();

							// Pump in the svg content
							var buffer = null;
							// Write the output of convert straight to the response
							convert.stdout.on('data', function(data) {	
								try {
									var prevBufferLength = (buffer ? buffer.length : 0),
										newBuffer = new Buffer(prevBufferLength + data.length);

									if (buffer) {
										buffer.copy(newBuffer, 0, 0);
									}

									data.copy(newBuffer, prevBufferLength, 0);

									buffer = newBuffer;

								} catch (err) {
									callback(err, null);
								}
							});

							// When we're done, we're done
							convert.on('close', function(code) {
								callback(null, buffer);
								self.emit("image", {
									job: jobName,
									buffer: buffer
								});
							});

						}

					} else {
						next();
						callback(new Error("No SVG found."));
					}
				});

				
			});
		});
		
		//Is this the only element in queue?
		if(queue.length == 1) {
			queue[0]();
		} 
		return this;
	}
	this.on("ready",updateSize);

}

NodeChart.prototype = Object.create(EventEmitter.prototype);

module.exports = new NodeChart();