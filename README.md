Introduction
============
node-svgchart aims to provide a general interface to generate charts on the server side without any need for an x-server or anything of the like.


Requirements
============
To get it up and running, there are some requirements to fulfill.

* librsvg (presence of a "rsvg" command)
* ImageMagick (unless you tell node-svgchart to guess the font metrics) 

Compatibility
=============
* AnyChart 6.0.10

Usage
=====
```javascript
var chart = require("node-svgchart");

chart
    .require("path/to/my/chart/lib.js")
    .setup(function(e, callback) {
    	//Setup chart using your library. Write to #chart.
    	//Note: The global object is still "global", so explicitly access "e.window".
        //IMPORTANT: You have to call the callback to make it continue. 
    })
    .create({
    	//Options that will be passed to rsvg
    	width: 500
    }, function(err, image) {
    	//image is a Readable Stream.
    });
```