var chart = require("../../lib/node-svgchart")
	,fs   = require("fs");

var configs = {};

fs.readdir('xml', function(err, files) {
	if(err) {
		return;
	}
	var ch = null;

	chart
		.require(["AnyChart.js", "AnyChartHTML5.js"])
		.setup(function(e, callback) {
			if(!ch) {
				e.window.AnyChart.renderingType = e.window.anychart.RenderingType.SVG_ONLY;
				ch = new e.window.AnyChart("chart");
				ch.setData(configs[e.job]);
				ch.write('chart');
			} else {
				ch.setData(configs[e.job]);
				//ch.refresh();
			}

			callback();

		})
		.on("svg", function(e) {
			fs.writeFile("svg/" + e.job + ".svg", e.svg);
		})
		.on("image", function(e) {
			fs.writeFile("png/" + e.job + ".png", e.buffer);
		})

	files.forEach(function(file) {
		fs.readFile("xml/" + file, function(err, xml) {
			var job = file.replace(/\.\w+$/, '');

			configs[job] = xml.toString();
			if(!err) {
				chart.create(job, {width: 500});
			}
		});
	});
	


});