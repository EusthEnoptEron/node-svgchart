/**
 * Adds VERY basic SVG support to jsdom's simulated browser environment.
 * Font information is taken from metrics.json -- so for new fonts, put
 * them into ../fonts and run build_metrics.php.
 */


//Load libs
var fs = require("fs"),
	_  = require("underscore");
		 
/*
//Fetch font data
var fontData = fs.readFileSync(__dirname + "/../metrics.json");
				fontData = eval('('+fontData+')');
 */
var fontData = [];

/*##############
 *# FUNCTIONS
 *##############*/

/**
 * get with of a text. The params should be self-explanatory
 */
var getTextWidth = function (text, font, fontSize, bold) {
	//Default vals
	if(!text) text = '';
	if(!fontSize) fontSize = 12;

	//Make sure font is a valid filename
	if(font && font.toLowerCase)
		font = font.toLowerCase().replace(/\s/g, "_");

	//Do we have metrics for this font and font size?
	if(!(font in fontData) || !(fontSize in fontData[font])) {
		//console.log(font + " not found!");
		//No, so make a guess
		return text.length * 9.026315789473685;
	} else {
		//console.log(font + "(" + fontSize + ") found!");
		//console.log(font + " meets " + text);
		//We have all data we need, so loop through the text and sum up the widths of the letters
		var width = 0;
		for(var i in text) {
			var letter = text[i];
			if(!(letter in fontData[font][fontSize])) {
				letter = "A";
			}
			width += fontData[font][fontSize][letter] * (bold ? 1.2 : 1);
		}
		return width;
	}
	//log(width);
};

/**
 * Get width of the text of an element. Font, font size, etc. will be determined from its css styles
 */
var getTextWidthByElement = function(text, el) {
	//No text at all?
	if(!el.textContent) return 0;
	//console.log(el);
	//console.log(el.counter);
	//console.log("    " + el.childNodes[0].nodeName);
	var font = el.fontFamily || el['font-family'];
	var fontSize = el.fontSize || el['font-size'];
	
	return getTextWidth(el.textContent, font, fontSize, el.fontWeight && el.fontWeight == 'bold');
};


/**
 * Simulate the SVGRect object.
 */
var SVGRect = function (el) {
	//el.test();
	if(el.tagName == 'text' || el.tagName == 'TEXT') {
		this.width = getTextWidthByElement(el.textContent, el);
		this.height = el.fontSize + 2 || 15; //make a guess about height
	}
	this.x = 0;
	this.y = 0;
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
			? getTextWidthByElement(this.textContent.substr(charnum, nchars), this)
			: 0;
	},
	
	getExtentOfChar: function(charnum) {
		return {
			width: this.getSubStringLength(charnum, 1)
			, height: this.fontSize + 2 || 15
		};
	}
};

//Stores recent font data
var latestFont = false,
	latestFontSize = false;

var i = 0;
//Regex to find a font family
var familyRegex = new RegExp(/font-?family:([^;]*)/i);
//Regex to find a font size
var sizeRegex = new RegExp(/font-?size:([^;]*)/i);

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

		//...but we extend the object with the bundle of SVG functions we have defined.
		_.extend(el, svgEl);
		
		//Set some dummy values to make AnyChart happy
		el.clientX = 0;
		el.clientY = 0;
		el.counter = i++;
		
		el._setAttribute = el.setAttribute;
		//the original setAttribute is somewhat buggy, therefore we have to make some adjustments
		el.setAttribute = function(attr, val) {
			//Bugfix for AnyChart v6.0 -- it requires you to have clientWidth and Height set.
			if(name == 'svg') {
				if(attr == 'width') {
					this.clientWidth = val;
				}
				if(attr == 'height') {
					this.clientHeight = val;
				}
			}
			
			var fontFamily = familyRegex.exec(val);
			var fontSize = sizeRegex.exec(val);
			if(fontFamily) {
				el./*style.*/fontFamily = window.$.trim(fontFamily[1]);
				//latestFont = window.$.trim(fontFamily[1]);
			}
			if(fontSize) {
				el./*style.*/fontSize = window.$.trim(fontSize[1]);
				//latestFontSize = window.$.trim(fontSize[1]);
			}
			if(attr == 'font-family')
				el.fontFamily = val;
			if(attr == 'font-size')
				el.fontSize = val;
			if(attr == 'font-weight')
				el.fontWeight = val;
			
			if(attr == 'style'){
				val = val.split(/;/);
				val.forEach(function(v) {
					el.style[v.split(/:/)[0]] = v.split(/:/)[1];
				});
				
				return;
			}
			
			this._setAttribute(attr, val);
		}
		return el;
	};
	
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
	var svg = svg.replace(/(<\/?)(\w+)gradient/g, '$1$2Gradient')
				   	.replace(/clippath/g, 'clipPath')
			   		.replace(/fill: ;/g, '')
				 	.replace(/fegaussianblur/ig, 'feGaussianBlur');
					
	//If we use raphael, we have to adjust the <svg> tags with some specs
	// if(loadRaphael) {
	// 	svg = svg.replace(/<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
	// 			   .replace(/href=/g, "xlink:href=")
				  /* .replace(/\<g visibility="hidden">/)*/;
	return svg;
}