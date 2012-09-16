//Load libs
var jsdom        = require("jsdom")
	, path       = require("path")
	, Contextify = require('contextify')
	, exec       = require('child_process').exec
	, md5     = require('crypto').createHash("md5")
	, fs = require("fs")
	, svgp = require("./node-chart/svg")
	, domparser = require("./node-chart/domparser")
	, _ = require("underscore")
	, domToHtml = require('./node-chart/domtohtml').domToHtml;


module.exports = new (function() {
	//List of dependencies
	var dependencies = [];

	//Function to set up chart.
	var setup = function() {};

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
		//Store absolute path.
		dependencies.push(path.resolve(dep));
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



	this.generate = function(options, callback) {
		// exports.require(__dirname + "/vendor/sizzle.js");
		//Simulate browser.
		jsdom.env({
			//Minimalisic web page
			html: '<html><body><div id="chart"></div></body></html>',
			scripts: dependencies,
			done: function(err, window) {
				if(err) {
					callback(err);
					return;
				}

				try {
					//Apply some patches.
					svgp.patch(window);
					domparser.patch(window);

					//Create our little DOM-world
					setup(window);

					//Get generated SVG.
					var svg = window.document.getElementsByTagName("SVG");

					if(svg.length) {
						
						svg = domToHtml(svg[0]);
						svg = svgp.clean(svg);

						var random = md5.update(new Date().toString()).digest("hex")
						   ,from   = "/tmp/" + random + ".svg"
						   ,to     = "/tmp/" + random + ".png";


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
								callback(null, fs.createReadStream(to).on("close", function() {
									fs.unlink(from);
									fs.unlink(to);
								}));

							});
						});

					} else {
						callback(new Error("No SVG found."));
					}


				} catch (e) {
					//Exception!
					callback(e);
				}
			}

		});
		return this;
	}
})();
