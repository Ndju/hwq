exports.login = function(req, res){
	//sets the sql statement to retrieve values from the row with the specified username and password;
	var sql = 'SELECT * FROM users WHERE username = ? AND password = ? ';
	console.log(sql);
	req.app.get('connection').query(sql, [req.body.username, req.body.password], function(err, rows, fields) {
	      if (err) {
	    	  //connection mess-up handler --> very unlikely as the statement is static and consistent
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //if password is incorrect then there will be 0 rows returned, hence the rows.length will equal 0
	    	 //console.log(rows);
		     //console.log(fields);
		     if( rows.length === 0 ){
		    	 res.redirect('/login-failure.html');	         
		     }else{
		    	 //if password is correct, the user name is saved into cookie-session for later 
		    	 req.session.user = req.body.username;
		    	 //id is saved as a cookie so further editing can be done, id is the first value of the rows dictionary
			     //(id is the safe access point for mysql database)
		    	 req.session.id = rows[0].id;
		    	 //redirects the website to query, this function will go on to load the ejs file.
	        	 res.redirect('/query');
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
	var sql = 'UPDATE users SET password=?, change_password=0 WHERE id =?';
	//replaces password at the "cookie-d" id (user who is logged on) with the new password given by change-password.html
	req.app.get('connection').query(sql, [req.body.newpassword, req.session.id], function(err, rows, fields) {
	      if (err) {
	    	  //very unlikely, hopefully this never happens
	    	  res.redirect('/login-failure.html');
	      } else {
	    	  //returns the page back to query
	        	res.redirect('/query');
		    }
	   });
}
