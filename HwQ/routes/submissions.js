/**
 * http://usejsdoc.org/
 */
var ejs = require('ejs');
var weebly = require("./weebly");

exports.query = function(req, res) {
	var results = [];
	var user = req.session.user.split(".");
	var capitalUser = [];
	//gets live data from weebly website via weebly object.
	weebly.getData(function(rows) {
		//loops through each submission.
		for (var i = 1; i < rows.length; i++) {
			var data = rows[i];
			//if admin, all rows are pushed into results array
			if (user[0] === 'p1admin' || user[0] === 'p2admin') {
				results.push(data);
				continue;
			}
			//but if student only the rows with same last name and containing the full first name will be pushed into results array.
			if (data[3].trim().toLowerCase() === user[1]) {
				if (data[2].trim().toLowerCase().indexOf(user[0]) > -1) {
					results.push(data);
				}
			}
		}
		for(var i = 0; i < user.length; i++){
			capitalUser.push(user[i].charAt(0).toUpperCase() + user[i].slice(1));
		}
		
				
		//sends the results under the name "submissions" to the subLists.ejs file
		res.render('subList', {
			user : capitalUser,
			submissions : results,
		});

	});
};


