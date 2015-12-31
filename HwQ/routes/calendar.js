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
	var classPeriodList= req.session.classPeriodList;
	var assignmentList = [];
	var sql = 'SELECT DATE_FORMAT(assigned_date, \'%Y-%m-%d\') AS assigned_date, title, DATE_FORMAT(due_date, \'%Y-%m-%d\') AS due_date,id,description ' +
	'FROM user.assignments WHERE class_period_fk = ?';
	console.log(sql);
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [ req.body.classperiodid ],
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
