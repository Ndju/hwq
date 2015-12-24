exports.login = function(req, res){
	var sql = 'SELECT * FROM users WHERE username = ? AND password = ? ';
	console.log(sql);
	req.app.get('connection').query(sql, [req.body.username, req.body.password], function(err, rows, fields) {
	      if (err) {
	    	  res.redirect('/login-failure.jsp');
	      } else {
		     console.log(rows);
		     console.log(fields);
		     if( rows.length == 0 ){
		    	 res.redirect('/login-failure.jsp');	         
		     }else{
		    	 req.session.user = req.body.username;
	        	 res.redirect('/query');
		     }
	      }
	   });
};