var chart = require("../../lib/node-svgchart")
	,fs   = require("fs");

var configs = {};

fs.readdir('xml', function(err, files) {
	if(err) {
		console.log("Something went wrong.", err);
		return;
	}
	var ch = null;

	chart
		.require(["AnyChart.js", "AnyChartHTML5.js"])
		.setup(function(e, window) {
			if(!ch) {
				window.AnyChart.renderingType = window.anychart.RenderingType.SVG_ONLY;
				ch = new window.AnyChart("chart");
				ch.setData(configs[e.job]);
				ch.write('chart');
			} else {
				ch.setData(configs[e.job]);
				ch.refresh();
			}
		})
		.on("svg", function(e) {
			fs.writeFile("svg/" + e.job + ".svg", e.svg);
		})
		.on("image", function(e) {
			e.stream.pipe(fs.createWriteStream("png/"+e.job+".png"));
		});

	files.forEach(function(file) {
		fs.readFile("xml/" + file, function(err, xml) {
			var job = file.replace(/\.\w+$/, '');

			configs[job] = xml;
			if(!err) {
				chart.create(job, {width: 500});
			}
		});
	});
	


});