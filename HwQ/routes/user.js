exports.login = function(req, res){
	//sets the sql statement to retrieve values from the row with the specified username and password;
	var capitalUser = [];
	var sql = 'SELECT users.id, users.username, users.first_name, users.last_name, users.is_teacher, student_period.period_id_fk, period.class_fk FROM period, student_period, users '+
		'WHERE id = student_id_fk AND period.period_id = period_id_fk AND username = ? AND password = ? ';
	console.log(sql);
	req.app.get('connection').query(sql, [req.body.username, req.body.password], function(err, rows, fields) {
	      if (err) {
	    	  //connection mess-up handler --> very unlikely as the statement is static and consistent
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //if password is incorrect then there will be 0 rows returned, hence the rows.length will equal 0
	    	 console.log(rows);
		     //console.log(fields);
		     if( rows.length === 0 ){
		    	 loginNewUser(req, res);
		     }else{
		    	 //if password is correct, the username, first name, and last name are saved into cookie-session for later 
		    	 req.session.user = req.body.username;
		    	 req.session.first = rows[0].first_name;
		    	 req.session.last = rows[0].last_name;
		    	 
		    	 //id is saved as a cookie so further editing can be done, id is the first value of the rows dictionary
			     //(id is the safe access point for mysql database)
		    	 req.session.id = rows[0].id;
		    	 req.session.is_teacher  = rows[0].is_teacher;
		    	 req.session.periodid = rows[0].period_id_fk;
		    	 req.session.classid = rows[0].class_fk;
		    	 
		    	 //FOR backward compatible with APCS Weebly integration
		    	 req.session.APCS_PERIOD = rows[0].period;
		    	 
		    	 console.log("Login successfully! Store user in session:" 
		    			 + "first name: " + req.session.first + "last name: " + req.session.last + "(id=" + req.session.id +")" + req.session.APCS_PERIOD) ;
		    	 console.log("[DEBUG]: " + req.session );
		    	 res.redirect('/calendar');
		     }
	      }
	   });
};

function loginNewUser(req, res){
	console.log("no classes")
	var sql = 'SELECT * FROM tswbatDB.users WHERE username = ? AND password = ?;';
	req.app.get('connection').query(sql, [req.body.username, req.body.password], function(err, rows, fields) {
      if (err) {
    	  res.redirect('/login-failure.html');
      } else {
	     if( rows.length === 0 ){
	    	 res.redirect('/login-failure.html');	         
	    	 return;
	     }
	     req.session.user =  req.body.username;
	     req.session.first = rows[0].first_name;
	     req.session.last = rows[0].last_name;
    	 req.session.id = rows[0].id;
    	 req.session.is_teacher  = rows[0].is_teacher;
    	 req.session.periodid = -1;
    	 req.session.classid = -1;

    	 res.redirect('/calendar');
      }
	});
}
	
exports.logout = function(req, res){
	//clears all cookies
	req.session = null ;

	//redirects page to the login.
	res.redirect('/');
};
exports.reset = function(req,res){
	//sets update statement up, the statement changes the password at certain id.
	var sql = 'UPDATE users SET password=? WHERE id =?';
	//replaces password at the "cookie-d" id (user who is logged on) with the new password given by change-password.html
	req.app.get('connection').query(sql, [req.body.newpassword, req.session.id], function(err, rows, fields) {
	      if (err) {
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //returns the page back to query
	        	res.redirect('/assignments?classperiodid='
						+ req.session.periodid);
		    }
	   });
}
exports.join = function(req,res){
	//gets the period id from the join Class Form
	var classCode = req.body.joinClass;
	var sql = 'INSERT INTO tswbatDB.student_period (student_id_fk, period_id_fk) VALUES (?, ?)';
	req.app.get('connection').query(sql, [req.session.id, classCode], function(err, rows, fields) {
	      if (err){
	    	  //very unlikely, hopefully this never happens
	    	  res.send('ERROR AT EXPORTS.JOIN' + err);
	      } else {
	    	  //returns the page back to query
	    	  res.redirect('/calendar');
		    }
	   });
	
}
exports.signup = function(req, res){
	console.log("matching:")
	console.log(req.body.signUpRepeatPass === req.body.signUpPass);
	//if not the same
	if(!(req.body.signUpRepeatPass === req.body.signUpPass)){
		  res.redirect('/login-failure.html')
	  }
	//inserts a new user's information into the user.users data table.
	var sql = 'INSERT INTO tswbatDB.users (username, first_name, last_name, password, is_teacher)' + 
	'VALUES (?, ?, ?, ?, ?);';
	req.app.get('connection').query(sql, [req.body.signUpUName, req.body.signUpFName, req.body.signUpLName, req.body.signUpPass, req.body.isTeacher], function(err, rows, fields) {
	      if (err){
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //returns the page back to query
	    	  res.redirect('/');		    }
	   });
}
exports.addClass = function(req,res){
	console.log(req.body.newClass);
	
	var sql = 'INSERT INTO tswbatDB.users (username, first_name, last_name, password, is_teacher)' + 
	'VALUES (?, ?, ?, ?, ?);';
	req.app.get('connection').query(sql, [req.body.signUpUName, req.body.signUpFName, req.body.signUpLName, req.body.signUpPass, req.body.isTeacher], function(err, rows, fields) {
	      if (err){
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //returns the page back to query
	    	  res.redirect('/');		    }
	   });
}
//generates a random classcode
function randomString(req, res){
	//key
	var Malphabet = "abcdeABVWXtuvwxyzIJfghijCDEFGHnopqrsRSTUklmKLMNOPQYZ";
	//random integer from 100 to 999
	var result = "" + Math.floor(Math.random()*(900)+100);
	//creates a key that is a three digit int + 2 letter string + three digit integer + 2 letter string + three digit integer
	for(i = 0; i < 2; i++){
		var random = Math.floor(Math.random()*(52));
		result = Malphabet.slice(random, random+2) + Math.floor(Math.random()*(900)+100);
	}
	return result;
	

}