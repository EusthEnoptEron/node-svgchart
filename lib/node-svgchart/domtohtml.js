var domtohtml = require("jsdom/lib/jsdom/browser/domtohtml");
var HTMLEncode = require('jsdom/lib/jsdom/browser/htmlencoding').HTMLEncode;

//List from node-htmlparser
var singleTags = {
  area: 1,
  base: 1,
  basefont: 1,
  br: 1,
  col: 1,
  frame: 1,
  hr: 1,
  img: 1,
  input: 1,
  isindex: 1,
  link: 1,
  meta: 1,
  param: 1,
  embed: 1
};


module.exports = domtohtml;



module.exports.stringifyElement = function stringifyElement(element) {
  var tagName = element._tagName,
      ret = {
        start: "<" + tagName,
        end:''
      },
      attributes = [],
      i,
      attribute = null;
  if (element.attributes.length) {
    ret.start += " ";
    for (i = 0; i<element.attributes.length; i++) {
      attribute = element.attributes.item(i);
      attributes.push(attribute.name + '="' +
                      HTMLEncode(attribute.nodeValue, true) + '"');
    }
  }
  ret.start += attributes.join(" ");

  if (singleTags[tagName]) {
    ret.start += " />";
    ret.end = '';
  } else {
    ret.start += ">";
    ret.end = "</" + tagName + ">";
  }

  return ret;
};
