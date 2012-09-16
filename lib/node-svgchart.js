//Load libs
var jsdom        = require("jsdom")
	, path       = require("path")
	, Contextify = require('contextify')
	, exec       = require('child_process').exec
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

	var window = null;
	var self = this;
	var queue = [];

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
		_.each(obj, function(val, key) {
			if(key.length == 1) {
				args.push("-" + key + " " + val);
			} else {
				args.push("--" + key + "=" + val);
			}
		});

		return args.join(" ");
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
					w.Array = Array;
					//Apply some patches.
					svgp.patch(w);
					domparser.patch(w);


					w.console = console;
					dependencies.forEach(function(script) {
						w.run(fs.readFileSync(script).toString());
					});

			
					window = w;
					callback(null, window);
					self.emit("ready", window);
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

							var random = crypto.createHash("md5").update(new Date().toString()+jobName).digest("hex")
							   ,from   = "/tmp/" + random + ".svg"
							   ,to     = "/tmp/" + random;


							fs.writeFile(from, svg, function(err) {
								if(err) {
									callback(err);
									return;
								}
								exec("rsvg " + objectToArgs(options) + " " + from + " " + to, function(err, o) {
									if(err) {
										fs.unlink(from);
										fs.unlink(to);
										callback(err);
										return;
									}

									var stream =  fs.createReadStream(to).on("close", function() {
										/*fs.unlink(from);
										fs.unlink(to);*/
									});

									callback(null,stream);
									self.emit("image", {
										job: jobName,
										stream: stream
									});
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
}

NodeChart.prototype = Object.create(EventEmitter.prototype);

module.exports = new NodeChart();