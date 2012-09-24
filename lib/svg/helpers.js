var core = require("./index").core;

/**
 * Class that helps calculating the bounding box of a path.
 * @param {[type]} path [description]
 */
exports.Path = function(path) {
	//Coordinates.
	var coordinates = [];

	//Current initial point
	var init = null;


	//Parse.
	var regex = /\b([mzlhvcsqta])([\d.-,\s]*)/ig,
		match = null;

	while(match = regex.exec(path)) {
		var command = match[1];
		var coords = match[2].split(/[,\s]+/);
		var relative = command.charCodeAt(0) >= 97;

		//Determine action
		switch(command.toLowerCase()) {
			case "m":
				this.moveTo(coords, relative);
				break;
			case 'l':
				this.lineTo(coords, relative);
				break;
			case 'h':
				var c = [];
				coords.forEach(function(x) {
					c.push(x, relative ? 0 : this.getReferencePoint().y);
				});
				this.lineTo(c, relative);
				break;
			case 'v':
				var c = [];
				coords.forEach(function(y) {
					c.push(relative ? 0 : this.getReferencePoint().x,
						   y);
				});
				this.lineTo(c, relative);
				break;
			case 'z':
				this.closePath();
				break;
		}
	}

	this.getReferencePoint = function(relative) {

	}

	//////////(//////////////////////////////////////////////////////////////////
	// METHODS
	////////////////////////////////////////////////////////////////////////////
	this.getBBox = function() {
		var x1 = x2 = y1 = y2 = null;

		if(coordinates.length) {
			coordinates.forEach(function(xy) {
				if(!x1) {
					x1 = x2 = xy.x;
					y1 = y2 = xy.y;
				} else {
					x1 = Math.min(x1, xy.x);
					y1 = Math.min(y1, xy.y);
						
					x2 = Math.max(x2, xy.x);
					y2 = Math.max(y2, xy.y);
				}
			});
			return new core.SGVRect(x1, y1, x2 - x1, y2 - y1);
		} else {
			return new core.SVGRect(0,0,0,0);
		}
	}

	this.lineTo = function(coords, rel) {
		var x, y;
		while((x = coords.shift())
			&&(y = coords.shift()) ) {
			c = push(x, y, rel);
			if(!init) {
				init = c;
			}
		}
	}

	this.moveTo = function(coords, rel) {
		var x, y;
		while((x = coords.shift())
			&&(y = coords.shift()) ) {
			init = push(x, y, rel);
		}
	}

	this.closePath = function() {
		if(init) {
			push(init.x, init.y, false);
		}
	}

	var push = function(x, y, relative) {
		var coords = null;
		if(relative && coordinates.length) {
			x += coordinates[coordinates.length - 1].x;
			y += coordinates[coordinates.length - 1].y;
		}
		coordinates.push({
			x: x,
			y: y
		});

		return coordinates[coordinates.lengtj - 1];
	}

}
