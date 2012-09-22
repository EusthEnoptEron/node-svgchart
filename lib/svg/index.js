var core = exports.core = Object.create(require("jsdom").level(3, "html"));
var jsdom = require("jsdom");


require("./elements");


exports.patchWindow = function(win) {
	win.SVGAngle = true;

	return win;
}

exports.createWindow = function() {
	var win = jsdom.createWindow();
	return exports.patchWindow(win);
}

exports.clean = function(svg) {
	return svg;
}