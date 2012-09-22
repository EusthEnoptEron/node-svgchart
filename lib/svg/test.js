var svg = require("./svgelement");
var jsdom = require("jsdom").jsdom;


function getDocument(src) {
	return jsdom("<html><head></head><body>"+src+"</body></html>", svg.html);
}

function test0() {
	var document = getDocument(
		'<rect x="0" y="0" id="rect" width="50" height="50" transform="translate(50, 90), rotate(-45), translate(130, 160)" />'
	);

	console.log(document.getElementById("rect").getCTM());

}

/**
 * Example #1: Simple groups and bounds
 * @see http://www.w3.org/TR/SVGTiny12/svgudom.html#svg__SVGLocatable
 * @return {[type]} [description]
 */
function test1() {
	var document = getDocument(
		'<g id="group1" transform="translate(10, 20)" fill="red">'+
		'	<rect id="rect1" transform="scale(2)" x="10" y="10" width="50" height="50"/>'+
		'	<rect id="rect2" x="10" y="10" width="100" height="100"/>'+
		'	<g id="group2" transform="translate(10, 20)">'+
		'	    <rect id="rect3" x="0" y="10" width="150" height="50"/>'+
		'	    <circle id="circle1" cx="20" cy="20" r="100" />'+
		'	</g>'+
		'</g>');

	console.log("-------TEST1---------");
	console.log("[group1] : " + document.getElementById("group1").getBBox().toString());
	console.log("[rect1] : " + document.getElementById("rect1").getBBox().toString());
	console.log("[rect2] : " + document.getElementById("rect2").getBBox().toString());
	console.log("[group2] : " + document.getElementById("group2").getBBox().toString());
	console.log("[rect3] : " + document.getElementById("rect3").getBBox().toString());
	console.log("[circle1] : " + document.getElementById("circle1").getBBox().toString());
}

function test2() {
	var document = getDocument(
		'<g id="group1" transform="translate(10, 20)" fill="red">'+
		'    <rect id="rect2" x="10" y="10" width="400" height="0"/>'+
		'    <g id="group2" transform="translate(10, 20)">'+
		'        <rect id="rect3" x="0" y="10" width="150" height="50"/>'+
		'    </g>'+
		'</g>'
	);

	console.log("-------TEST2---------");
	console.log("[group1] : " + document.getElementById("group1").getBBox().toString());
	console.log("[rect2] : " + document.getElementById("rect2").getBBox().toString());
	console.log("[group2] : " + document.getElementById("group2").getBBox().toString());
	console.log("[rect3] : " + document.getElementById("rect3").getBBox().toString());
}

function test3() {
	var document = getDocument(
		' <g id="group1" transform="translate(10, 20)" fill="red">'+
		'        <rect id="rect1" x="10" y="10" width="100" height="100"/>'+
		'        <ellipse id="ellipse1" cx="20" cy="20" rx="0" ry="70" />'+
		'    </g>'
	);

	console.log("-------TEST3---------");
	console.log("[group1] : " + document.getElementById("group1").getBBox().toString());
	console.log("[rect1] : " + document.getElementById("rect1").getBBox().toString());
	console.log("[ellipse1] : " + document.getElementById("ellipse1").getBBox().toString());
}


test1();
test2();
test3();