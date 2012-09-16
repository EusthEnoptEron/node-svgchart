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
	var setup = function() {};

	var window = null;
	var self = this;

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
				scripts: dependencies,
				done: function(err, w) {
					if(err) {
						callback(err);
						return;
					}

					//Apply some patches.
					svgp.patch(w);
					domparser.patch(w);

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
	};



	this.generate = function(options, callback) {
		this.start(function(err) {
			if(err) {
				callback(err);
				return;
			}

			window.document.getElementById("chart").innerHTML = '';

			//Create our little DOM-world
			setup(window);

			//Get generated SVG.
			var svg = window.document.getElementsByTagName("SVG");

			if(svg.length) {
				
				svg = domToHtml(svg[0]);
				svg = svgp.clean(svg);

				var e = { svg: svg, stop: false };
				self.emit("svg", e);

				if(!e.stop) {

					var random = crypto.createHash("md5").update(new Date().toString()).digest("hex")
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
								fs.unlink(from);
								fs.unlink(to);
							});

							callback(null,stream);
							self.emit("image", stream);
						});
					});
				}

			} else {
				callback(new Error("No SVG found."));
			}
		});

		return this;
	}
}

NodeChart.prototype = Object.create(EventEmitter.prototype);

module.exports = new NodeChart();