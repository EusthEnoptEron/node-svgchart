/**
 * Adds VERY basic SVG support to jsdom's simulated browser environment.
 * Font information is taken from metrics.json -- so for new fonts, put
 * them into ../fonts and run build_metrics.php.
 */


//Load libs
var fs = require("fs")
	, _  = require("underscore")
	, execSync = require("exec-sync");
		 
/*
//Fetch font data
var fontData = fs.readFileSync(__dirname + "/../metrics.json");
				fontData = eval('('+fontData+')');
 */
var fontCache = {};

/*##############
 *# FUNCTIONS
 *##############*/

var metricsRegex = /\s*(.+?):\s*(.*?)[;:]/g;

/**
 * [getTextMetrics description]
 * @param  {string} text     Text to be measured.
 * @param  {string} font     Font face.
 * @param  {int}    fontSize Font size. Probably points, but pixels should work well enough, too.
 * @param  {object} styles   Object with style options. Not implemented yet.
 * @return {object}          An object that contains the font metrics of the text.
 *                           You will want to access the properties "width" and "height."
 * @todo Implement styles.
 */
var getTextMetrics = function(text, font, fontSize, styles) {

	//Normalize values.
	text     = text || '';
	font     = font || "Arial";
	fontSize = fontSize || 12;
	

	if(!fontCache[font])
		fontCache[font] = {};
	if(!fontCache[font][fontSize])
		fontCache[font][fontSize] = {};
	if(fontCache[font][fontSize][text]) {
		return fontCache[font][fontSize][text];
	}

	//Make command
	var command = "convert xc: -font '"
					+ font
				   + "' -pointsize "
				    + fontSize
				   + " -debug annotate -annotate 0 '"
				    + text
				   + "' null: 2>&1 | grep Metrics: | fmt -w80";
	
	var metricsRaw = execSync(command)
	, metrics = {}
	, m = null;
	
	//Remove unneeded information
	metricsRaw = metricsRaw.replace(/^\s*Metrics: /, '')
						   .replace(text, '');

	//Convert string > object
	while(m = metricsRegex.exec(metricsRaw)) {
		metrics[m[1]] = isNaN(m[2]) 
						? m[2]
						: m[2] * 1;
	}
	fontCache[font][fontSize][text] = metrics;
	// console.log("(" + font  + "@"+fontSize+") " + text + " : " + metrics.width);
	// console.log(command);
	return metrics;
}

/**
 * Get width of the text of an element. Font, font size, etc. will be determined from its css styles
 */
var getTextMetricsByElement = function(el, text) {
	text = text || el.textContent;

	//No text at all?
	if(!text) return {width: 0, height: 0};

	//console.log(el.counter);
	//console.log("    " + el.childNodes[0].nodeName);
	var font =  el.getAttribute("font-family");
	var fontSize = el.getAttribute("font-size");
	var fontWeight = el.getAttribute("font-weight"); 

	if(el.getAttribute("font")) {
		var f = el.getAttribute("font");
		fontSize = f.replace(/^.*?(\d+?)px.*$/, "$1");
		font     = f.replace(/^.*?([A-Z-]{3,}).*$/i, "$1");

		if(font) {
			el.setAttribute("font-family", font);
			el.setAttribute("font-size", fontSize);
		}
	}

	return getTextMetrics(text, font, fontSize, {} );
};

var i = 0;

/**
 * Hacky attempt to calculate more-or-less valid bounding boxes. 
 * Calculates all child-bboxes, takes their translation in consideration and returns the "true" bbox.
 * @param  {[type]} el  [description]
 * @param  {[type]} box [description]
 * @return {[type]}     [description]
 */
function calcBoundingBox(el, box) {
	if(!el.getBBox) {
		return {width: 0, height: 0, x: 0, y: 0};
	}

	box = box || el.getBBox();

	el.childNodes.forEach(function(sel) {
		if(sel.nodeType == 3) return;

		var cbox = calcBoundingBox(sel);
		var transform = sel.getAttribute("transform"),
			match;

		if(transform) {
			if(match = transform.match(/translate\(\s*([\d-.]+)\s*,\s*([\d-.]+)\s*\)/)) {
				cbox.x += match[1] * 1;
				cbox.y += match[2] * 1;
			}
			/*if(match = transform.match(/rotate\(\s*([270]+)\s+([\d-.]+)\s+([\d-.]+)\s*\)/)) {
				console.log("ROTATE");
			}*/
		}

		box.x = Math.min(cbox.x, box.x);
		box.y = Math.min(cbox.y, box.y);
		box.width  = Math.max(cbox.width + cbox.x, box.width);
		box.height = Math.max(cbox.height  + cbox.y, box.height);
	});
	return box;
}



/**
 * Simulate the SVGRect object.
 */
function SVGRect(el) {
	this.x = this.y = this.width = this.height = 0;
	if(el) {
		this.x = el.getAttribute("x") * 1 || 0;
		this.y = el.getAttribute("y") * 1 || 0;

		//el.test();
		if(el.tagName == 'TEXT') {

			var metrics = getTextMetricsByElement(el);
			this.width = metrics.width;
			this.height = metrics.height;

			this.y -= this.height / 2;

			//Correct bounding box.
			switch(el.getAttribute("text-anchor")) {
				case 'middle':
					this.x -= metrics.width / 2;
					break;
				case 'end':
					this.x -= metrics.width;
			}
		} else if(el.tagName == 'G') {
			this.prototype = calcBoundingBox(el, this);
		} else {
			this.width =  el.getAttribute("width") || 0;
			this.height = el.getAttribute("height") || 0;;
		} 
	}

}

function emptyFunction() {}

//Dummy matrix.
function SVGMatrix() {
	//Properties
	this.a = 0;
	this.b = 0;
	this.c = 0;
	this.d = 0;
	this.e = 0;
	this.f = 0;


	this.flipX = emptyFunction;
	this.flipY = emptyFunction;
	this.inverse = emptyFunction;
	this.multiply = emptyFunction;
	this.rotate = emptyFunction;
	this.rotateFromVector = emptyFunction;
	this.scale = emptyFunction;
	this.scaleNonUniform = emptyFunction;
	this.skewX = emptyFunction;
	this.skewY = emptyFunction;
	this.translate = emptyFunction;
}
	

/**
 * Assemble a minimal subset of the SVG specs 
 */
var svgEl = {
	getBBox: function() {
		return new SVGRect(this);
	},
	
	getNumberOfChars: function() {
		return this.textContent ? this.textContent.length : 0;
	},
	
	getComputedTextLength: function() {
		return this.getBBox().width;
	},
	
	getSubStringLength: function(charnum, nchars) {
		return this.textContent 
			? getTextMetricsByElement(this, this.textContent.substr(charnum, nchars)).width
			: 0
	},
	
	getExtentOfChar: function(charnum) {
		var metrics = getTextMetricsByElement(this, this.textContent.substr(charnum, 1));
		return {
			width: metrics.width
			, height: metrics.height
		};
	},
	createSVGRect: function() {
		return new SVGRect();
	},
	createSVGMatrix: function() {
		return new SVGMatrix();
	},
	getScreenCTM: function() {
		return this.createSVGMatrix();
	},
	setAttributeNS: function(ns, name, value) {
		this.setAttribute(name, value);
	}
};

/**
 * Applies our SVG patch to a jsdom-generated window object
 */
exports.patch = function(window) {
	//Act as though we implemented the SVG specs
	window.SVGAngle = true;
	
	//Simulate createElementNS() which is used to create SVG nodes
	window.document.createElementNS = function(ns, name) {
		//In fact, we create an element the same way as always...
		var el = window.document.createElement(name);

		//...but we extend the object with the bundle of SVG nctions we have defined.
		_.extend(el, svgEl);
		el.namespaceURI = ns;

		return el;
	};

	var setAttribute = window.HTMLElement.prototype.setAttribute;
	window.HTMLElement.prototype.setAttribute = function(name, value) {
		//Only allow assignments that make sense (x="" causes problems with rsvg)
		//This might need some rework to suppport attributes (checked, etc).
		if(value !== '') {
			setAttribute.call(this, name, value);
		}
	}

	window.HTMLElement.prototype.__defineGetter__("offsetWidth", function() {
		return this.getAttribute("offsetWidth") || this.width || this.getAttribute("width")  || this.style.width;
	});
	window.HTMLElement.prototype.__defineSetter__("offsetWidth", function(width) {
		this.setAttribute("offsetWidth", width);
	});
	window.HTMLElement.prototype.__defineGetter__("offsetHeight", function() {
		return this.getAttribute("offsetHeight") || this.height || this.getAttribute("height")  || this.style.height;
	});
	window.HTMLElement.prototype.__defineSetter__("offsetHeight", function(height) {
		this.setAttribute("offsetHeight", height);
	});


	return window;
};

exports.clean = function(svg) {

	/*##########################
	*# XML SANITATION
	*########################*/	
	//# Step 1, pull up weeds using jQuery
	// var svgEl = $container.children('svg');
	// svgEl.find("[visibility=hidden]").remove();
	
	//Activate this if you want to have correct clipping (but note that labels will be cut off when they're outside the borders)
	/*//Puts the defs to the right place
	var defs = svgEl.find("defs:first");
	svgEl.find("clippath").appendTo(defs);*/
	

	//# Step 2, correct some tags using RegEx
	var svg = svg.replace(/fill: ;/g, '');
					
	return svg;
}