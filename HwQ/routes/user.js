exports.login = function(req, res){
	//sets the sql statement to retrieve values from the row with the specified username and password;
	var capitalUser = [];
	var sql = 'SELECT * FROM tswbatDB.users WHERE username = ? AND password = ? ';
	console.log(sql);
	req.app.get('connection').query(sql, [req.body.username, req.body.password], function(err, rows, fields) {
	      if (err) {
	    	  //connection mess-up handler --> very unlikely as the statement is static and consistent
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //if password is incorrect then there will be 0 rows returned, hence the rows.length will equal 0
		     if( rows.length === 0 ){
		    	 res.redirect('/login-failure.html');
		     }else{
		    	 console.log(rows);
		    	 // all values from user table are saved as cookies
		    	 //username
		    	 req.session.user = req.body.username;
		    	 //first name
		    	 req.session.first = rows[0].first_name;
		    	 //last name
		    	 req.session.last = rows[0].last_name;
		    	 //id
		    	 req.session.id = rows[0].id;
		    	 //is_teacher
		    	 req.session.is_teacher  = rows[0].is_teacher;
		    	 //set to null
		    	 req.session.periodid = -1;
		    	 req.session.classid = -1;
		    	 req.session.settingsList = [];
		    	 
		    	 console.log("User profile ==>" 
		    			 + "FIRST NAME: " + req.session.first + " LAST NAME: " + req.session.last + "USERNAME: " + req.session.user +" [id=" + req.session.id +"]") ;
		    	 res.redirect('/calendar');
		     }
	      }
	   });
};
	
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
						+ req.session.urlid);
		    }
	   });
}
exports.join = function(req,res){
	//gets the period id from the join Class Form
	var pCode = req.body.joinClass;
	var sql = 'INSERT INTO tswbatDB.student_period (student_id_fk, period_id_fk, disabeled) VALUES (?, ?, 0)';
	req.app.get('connection').query(sql, [req.session.id, pCode], function(err, rows, fields) {
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
	var finish = 0;
	console.log(req.body.newClass);
	//generate classCode
	var cCode = randomString();
	// insert data into class table
	var classSql = 'INSERT INTO tswbatDB.class (class_id, class_name, disabled) VALUES (?, ?, 0);';
	req.app.get('connection').query(classSql, [cCode, req.body.newClass], function(err, rows, fields) {
	      if (err){
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	    // if that works, insert data into owner table
	      } else {
	    	  ++finish;
	    	  console.log(1); 
	    }
	   });
	console.log('finished w/ 1')
	var ownerSql = 'INSERT INTO tswbatDB.owner_table (owner_id, class_id_fk) VALUES (?, ?);'
   	 req.app.get('connection').query(ownerSql, [req.session.id, cCode], function(err, rows, fields) {
   		 if (err){
   			 console.log(err);
  	    	  //very unlikely, hopefully this never happens
  	    	  res.redirect('/login-failure.html');
  	      	} else {
  	      	++finish
  	    	  console.log(2);
  	      	}
  	   });
	console.log('finished w/ 2')
	//for loop through every check box
	if(req.body.periodNumber.length <= 0){
		res.redirect('/login-failure.html');
	}
    	var pArray = new Array(req.body.periodNumber.length);
    	for(i = 0; i < req.body.periodNumber.length; i++){
    		pArray[i] = new Array(3);
    	}
    	for(i = 0; i < req.body.periodNumber.length; i++){
    		//because mysql connections are async, need to set value of index before you begin in order to go into the database at the correct time.
	      		var ivalue = req.body.periodNumber[i];
	      		pArray[i][0] = parseInt(ivalue);
	      		//generates random period number
	      		var rPeriod = Math.floor(Math.random()*(99900000)+100000);
	      		pArray[i][1] = rPeriod;
	      		pArray[i][2] = cCode;
    	}
    	console.log(pArray);
//    		var periodSql = 'INSERT INTO tswbatDB.period (period, period_id, class_fk) VALUES (?, ?, ?);'
    		var periodSql = 'INSERT INTO tswbatDB.period (period, period_id, class_fk) VALUES ?';
    		values = 
    		req.app.get('connection').query(periodSql, [pArray], function(err, rows, fields) {
    		if (err){
    			console.log(err)
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	      	} else {
	      			++finish
		    	  console.log(3);
	      	}
	   	   });
    		setTimeout(function() {
				if (finish == 3) {
					res.redirect('/calendar');
				}
				console.log("what is this");
			}, 5 * 100);
}
//generates a random classcode
function randomString(req, res){
	//key
	var Malphabet = "aWXtuyzIJfghVqrsRKoLMNFvwxGHnSTUklmOPQCDijbcdeABEpYZ";
	//random integer from 100 to 999
	var result = "" + Math.floor(Math.random()*(900)+100);
	//creates a key that is a three digit int + 2 letter string + three digit integer + 2 letter string + three digit integer
	for(i = 0; i < 2; i++){
		var random = Math.floor(Math.random()*(52));
		result = result + Malphabet.slice(random, random+2) + Math.floor(Math.random()*(900)+100);
	}
	return result;
	

}