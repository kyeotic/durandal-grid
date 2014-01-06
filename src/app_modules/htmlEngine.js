var fs = require("fs");

var replaceMap = function(text, map) {
	var pattern = /\{\{\s+?(\w.+?)\s+?\}\}/;
	var result;
	while (result = pattern.exec(text)) {
		var match = result[0],
			name = result[1];
		if (!map[name])
			throw new Error("HTML replacement map doesn't contain:  " + name);
		text = text.replace(match, map[name]);
	}
	return text;
};

module.exports = function(map) {
	return function (file, options, next) {
	    fs.readFile(file, function (err, data) {
	        if (err) {
	            next(err);
	        } else {
	            next(null, replaceMap(data.toString(), map));
	        }
	    });
	};
};