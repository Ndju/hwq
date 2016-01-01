
exports.cal = function(req, res){
	var assignmentList = [];
	//initializes list of information to be rendered on calendar.ejs
	var classPeriodList = [];
	//this statement goes through database to draw out class name and class period_id and period.
	var sql = 'SELECT class.class_name, period.period_id, period.period ' + 
		'FROM user.student_period, user.period, user.class ' +
	    'WHERE user.student_period.student_id_fk = ? ' +
	    'AND user.period.period_id = user.student_period.period_id_fk ' +
	    'AND user.class.class_id = user.period.class_fk ';
	console.log(sql);
	//creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql,
			[ req.session.id ],
			function(err, rows, fields) {
				if (err) {
					//connection mess-up handler --> very unlikely as the statement is static and consistent
					res.redirect('/login-failure.html');
				} else {
					//if password is incorrect then there will be 0 rows returned, hence the rows.length will equal 0
					//console.log(rows);
					//console.log(fields);
					if (rows.length === 0) {
						res.redirect('/login-failure.html');
					} else {
						//for loops through each line of data from mysql
						for(var i = 0; i < rows.length; i++){
							classPeriodList.push(rows[i]);
						}
						req.session.classPeriodList = classPeriodList;
						res.render('calendar', { /* Put the code that passes variables to homepage so that computer can get
							 user's files for the calendar here. check submissions for this) */
								assignmentList: assignmentList,
								classList: classPeriodList,
								title: 'Express'
							});
					}
				}
			});
};
exports.assignments = function(req, res){
	//gets the classPeriod list for sidebar
	var classPeriodList= req.session.classPeriodList;
	//sets current period as periodsession to be used in other functions (see below)
	req.session.periodid = req.query.classperiodid;
	var assignmentList = [];
	var sql = 'SELECT DATE_FORMAT(assigned_date, \'%Y-%m-%d\') AS assigned_date, title, DATE_FORMAT(due_date, \'%Y-%m-%d\') AS due_date, id, description, class_name, period ' +
	'FROM user.assignments, user.period, user.class WHERE class_period_fk = ? AND period_id = class_period_fk AND class_fk = class_id';
	console.log(sql);
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [ req.query.classperiodid ],
			function(err, rows, fields) {
				if (err) {
					// connection mess-up handler --> very unlikely as the
					// statement is static and consistent
					res.redirect('/login-failure.html');
				} else {
					// for loops through each line of data from mysql
					for (var i = 0; i < rows.length; i++) {
						//each row index = dictionary of values from mysql
						assignmentList.push(rows[i]);
					}
					res.render('calendar', {
						classList: classPeriodList,
						assignmentList : assignmentList,
						title : 'Express'
					});
				}
			});
}

exports.newAssignments = function(req, res){
	function convertdate(date){
		var upDate = new Date(date);
		var m = String(upDate.getMonth()+1);
		if (m.length === 1){
			m = "0" + (m);
		}
		var d = String(upDate.getDate());
		if (d.length === 1){
			d = "0" + d;
		}
	
		var y = String(upDate.getFullYear());
		return (y + "-" + (m) + "-" + d);
	}
	
	//gets values to plug into assignment table
	var start = req.body.startdate;
	var end = req.body.duedate;
	start = convertdate(start);
	end = convertdate(end);
	var title = req.body.title;
	var id = Math.random() * (9000 - 1) + 1;
	
	
	var description = req.body.descriptiontext;
	var sql = 'INSERT INTO user.assignments (id, title, assigned_date, due_date, class_period_fk, description)' + 
	'VALUES (?, ?, ?, ?, ?, ?)';
	// creates the connection with mysql database and executes statement.
	//req.app.get('connection').query(sql, [id, title, start, end, req.session.periodid, description], function(err, rows, fields) {
	req.app.get('connection').query(sql, [id, title, start, end, req.session.periodid, description], function(err, rows, fields) {
		if (err) {
			// connection mess-up handler --> very unlikely as the
			// statement is static and consistent
			res.redirect('/login-failure.html');
		} else {
			//by using a get statement instead of post, the page is easily refreshed by simply plugging in the periodid into the url statement.
			res.redirect('/assignments?classperiodid='+req.session.periodid);
		}
	});
	
}


