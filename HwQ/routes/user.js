

exports.login = function(req, res){
	//sets the sql statement to retrieve values from the row with the specified username and password;
	var capitalUser = [];
	var sql = 'SELECT id, users.period, username,is_teacher, period_id_fk, class_fk FROM period, student_period, users '+
		'where id = student_id_fk AND period.period_id = period_id_fk AND username = ? AND password = ? ';
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
		    	 //if password is correct, the user name is saved into cookie-session for later 
		    	 req.session.user = req.body.username;
		    	 //takes the username and splits it at the period
		    	 var user = req.session.user.split(".");
		    	 //for loop capitalizes the first letter of both the first and last name
		    	 for(var i = 0; i < user.length; i++){
		 			capitalUser.push(user[i].charAt(0).toUpperCase() + user[i].slice(1));
		 		}
		    	 //Special case for admin user
		    	 if( capitalUser.length==1)
		    		 capitalUser.push("");
		    	 
		    	 //creates session variable that is the user's name
		    	 req.session.usernameFL = capitalUser;
		    	 
		    	 //id is saved as a cookie so further editing can be done, id is the first value of the rows dictionary
			     //(id is the safe access point for mysql database)
		    	 req.session.id = rows[0].id;
		    	 req.session.is_teacher  = rows[0].is_teacher;
		    	 req.session.periodid = rows[0].period_id_fk;
		    	 req.session.classid = rows[0].class_fk;
		    	 
		    	 //FOR backward compatible with APCS Weebly integration
		    	 req.session.APCS_PERIOD = rows[0].period;
		    	 
		    	 console.log("Login successfully! Store user in session:" 
		    			 + req.session.usernameFL + "(id=" + req.session.id +")" + req.session.APCS_PERIOD) ;
		    	 console.log("[DEBUG]: " + req.session );
		    	 
		    	 //Redirect to Weebly query page by default for APCS class
		    	 res.redirect('/query2');
		     }
	      }
	   });
};

function loginNewUser(req, res){
	var sql = 'SELECT * FROM users where username = ? AND password = ? ';
	req.app.get('connection').query(sql, [req.body.username, req.body.password], function(err, rows, fields) {
      if (err) {
    	  res.redirect('/login-failure.html');
      } else {
	     if( rows.length === 0 ){
	    	 res.redirect('/login-failure.html');	         
	    	 return;
	     }
	     req.session.user =  req.body.username;
    	 req.session.usernameFL = req.session.user ;
	     
    	 req.session.id = rows[0].id;
    	 req.session.is_teacher  = rows[0].is_teacher;
    	 
    	 res.redirect('/query2');
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
	var sql = 'UPDATE users SET password=?, change_password=0 WHERE id =?';
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
	var sql = 'INSERT INTO user.student_period (student_id_fk, period_id_fk) VALUES (?, ?)';
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
	username = req.body.signUpFName + "." + req.body.signUpLName;
	console.log(username);
	console.log(req.body.signUpRepeatPass);
	console.log(req.body.signUpPass);
	console.log(req.body.signUpRepeatPass === req.body.signUpPass);
	//if not the same
	if(!(req.body.signUpRepeatPass === req.body.signUpPass)){
		  res.redirect('/login-failure.html')
	  }
	//if doesn't actually submit
	if(username == "."){
		res.redirect('/login-failure')
	}
	//inserts a new user's information into the user.users data table.
	var sql = 'INSERT INTO user.users (id, username, password, period, change_password, is_teacher)' + 
	'VALUES (null, ?, ?, null, 0, ?);';
	req.app.get('connection').query(sql, [username, req.body.signUpPass, req.body.isTeacher], function(err, rows, fields) {
	      if (err){
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //returns the page back to query
	    	  res.redirect('/');		    }
	   });
}