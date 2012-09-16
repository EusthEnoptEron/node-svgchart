var jsdom = require("jsdom");

DOMParser = function(principle, documentURI, baseURI) {
};

function trim(str) {
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

var indent = 0;

/**
 * Takes a DOM element and extracts/adjusts only the most important values.
 * 
 */
function parseDOM(el, nodeType) {
	var children = [];
	//console.log(new Array(indent).join(" ") + el.nodeName);
	
	indent += 2;
	for(var i = 0; i < el.childNodes.length; i++) {
		children.push(parseDOM(el.childNodes[i]));
	}
	indent -= 2;
	
	if(el.nodeType == 3) {
		if(trim(el.nodeValue).length > 0) {
			nodeType = 4;
			el.value = trim(el.nodeValue);
		}
	}
	
	return {
		"nodeType": (nodeType ? nodeType : el.nodeType)
		, nodeName: el.nodeName.toLowerCase()
		, childNodes: children
		, attributes: el.attributes
		, nodeValue: el.nodeValue
		, value: el.value
		, textContent: el.textContent
	};
}

DOMParser.prototype.parseFromString = function(xmlstring, mimetype){
	//Use jsdom to parse the XML as HTMl, after which we simplify the tree
	var xml = jsdom.jsdom(xmlstring);
	var doc = {
		documentElement: parseDOM(xml.children[0], 1)
		, nodeType: 9
		, nodeName: "#document"
	}
	
	return doc;
};

exports.patch = function(window) {
	window.DOMParser = DOMParser;
}