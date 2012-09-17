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
	, height = null;

	function next() {
		queue.shift();
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
			if(height)
				chart.height = height;
			if(width)
				chart.width  = width;
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


					dependencies.forEach(function(script) {
						w.run(fs.readFileSync(script).toString());
					});
					w.Array = Array;
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
	this.end = function() {
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

							// Pump in the svg content
							convert.stdin.write(svg);
							convert.stdin.end();
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
							convert.on('exit', function(code) {
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