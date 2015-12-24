/**
 * http://usejsdoc.org/
 */
var ejs = require('ejs');
var weebly = require("./weebly");
var csv = require('fast-csv');
var results = [];

exports.query = function(req, res) {
	var user = req.session.user.split(".");
	weebly.getData(function(rows) {
		for (var i = 1; i < rows.length; i++) {
			var data = rows[i];
			if (user[0] === 'p1admin' || user[0] === 'p2admin') {
				results.push(data);
				continue;
			}
			if (data[3].trim().toLowerCase() === user[1]) {
				if (data[2].trim().toLowerCase().indexOf(user[0]) > -1) {
					results.push(data);
				}
			}
		}
		res.render('subList', {
			user : 'Andy',
			submissions : results,
			title : "homepage"
		});

	});
};


