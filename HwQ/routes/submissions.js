/**
 * http://usejsdoc.org/
 */
var ejs = require('ejs');
var weebly = require("./weebly");

exports.query2 = function(req, res) {
	var results = [];
	var user = req.session.user.split(".");
	//gets live data from weebly website via weebly object.
	weebly.getData(req, function(rows) {
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
				
		//sends the results under the name "submissions" to the subLists.ejs file
		res.render('subList', {
			user : req.session.usernameFL,
			submissions : results,
		});

	});
};
exports.querySubmission = function(req, res){
	var results = [];
	console.log('HELLO::::' + req.session.id + " AND " + req.session.periodid);
	//links submission table with assignment table and returns total result
	var sql = 'SELECT date_submitted, IP_Address, last_name, first_name, submission_id, file1_url, file2_url, file3_url '
		+'FROM user.submissions, user.assignments ' +
		'WHERE student_id = ? AND class_period_fk = ? ' +
		'AND id = assignment_id';
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [req.session.id, req.session.periodid],function(err, rows, fields) {
			if (err) {
				console.log('MYSQL Error: ' + err )
			}else{
				if( rows.length === 0 ){
					console.log("No submission found!");
				}else{
				    console.log("Found rows " + rows.length );	
				}
				//this for loop goes through each row, each row is a dictionary that contains the values requested from the sql statement
				//then after every value is drawn, it is pushed into another array, to create a two dimensional array for each row of data.
				for (var i = 0; i < rows.length; i++) {
					var data = [];
					data.push( rows[i].date_submitted );
					data.push( rows[i].IP_Address );
					data.push(rows[i].last_name);
					data.push(rows[i].first_name);
					data.push(rows[i].submission_id);
					//this checks if the file is empty, nameStart finds the name of the file (last section of the url) and displays it as the link
					if(rows[i].file1_url != " "){
						var nameStart = rows[i].file1_url.indexOf("_") + 1;
						data.push("<a href ='" + rows[i].file1_url + "'>" + rows[i].file1_url.substring(nameStart) + "</a>");
					}
					if(rows[i].file2_url != " "){
						var nameStart = rows[i].file1_url.indexOf("_") + 1;
						data.push("<a href ='" + rows[i].file2_url + "'>" + rows[i].file2_url.substring(nameStart) + "</a>");
					}else{
						data.push("");
					}
					if(rows[i].file3_url != " "){
						var nameStart = rows[i].file1_url.indexOf("_") + 1;
						data.push("<a href ='" + rows[i].file3_url + "'>" + rows[i].file3_url.substring(nameStart) + "</a>");
					}else{
						data.push("");
					}
					results.push(data);
				}
			}
		res.render('submissionList', {
			user : req.session.usernameFL,
			submissions : results,
			classList: req.session.classPeriodList
			});

	});
}

