var aws = require("aws-sdk");
//app.use(express.methodOverride());
var Busboy = require('busboy');
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
aws.config.update({
	accessKeyId : AWS_ACCESS_KEY,
	secretAccessKey : AWS_SECRET_KEY
});
var s3 = new aws.S3();

//THIS FUNCTION LOADS THE SIDEBAR FOR STUDENT;
exports.cal = function(req, res) {
	var assignmentList = [];
	//initializes list of information to be rendered on calendar.ejs
	var classPeriodList = [];
	//this statement goes through database to draw out class name and class period_id and period.
	var sql = 'SELECT class.class_name, period.period_id, period.period '
			+ 'FROM user.student_period, user.period, user.class '
			+ 'WHERE user.student_period.student_id_fk = ? '
			+ 'AND user.period.period_id = user.student_period.period_id_fk '
			+ 'AND user.class.class_id = user.period.class_fk ';
	console.log(sql);
	//creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [ req.session.id ],
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
						for (var i = 0; i < rows.length; i++) {
							classPeriodList.push(rows[i]);
						}
						req.session.classPeriodList = classPeriodList;
						res.render('calendar', { /* Put the code that passes variables to homepage so that computer can get
												 user's files for the calendar here. check submissions for this) */
							assignmentList : assignmentList,
							classList : classPeriodList,
							title : 'Express'
						});
					}
				}
			});
};
//THIS FUNCTION LOADS THE EVENTS ON A CALENDAR BASED ON WHAT CLASS IS CHOSEN
exports.assignments = function(req, res) {
	// gets the classPeriod list for sidebar
	var classPeriodList = req.session.classPeriodList;
	// sets current period as periodsession to be used in other functions (see
	// below)
	req.session.periodid = req.query.classperiodid;
	var assignmentList = [];
	var sql = 'SELECT DATE_FORMAT(assigned_date, \'%Y-%m-%d\') AS assigned_date, title, DATE_FORMAT(due_date, \'%Y-%m-%d\') AS due_date, id, description, class_name, period '
			+ 'FROM user.assignments, user.period, user.class WHERE class_period_fk = ? AND period_id = class_period_fk AND class_fk = class_id';
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
						// each row index = dictionary of values from mysql
						assignmentList.push(rows[i]);
					}
					res.render('calendar', {
						classList : classPeriodList,
						assignmentList : assignmentList,
						title : 'Express'
					});
				}
			});
}
// THIS FUNCTION CREATES NEW EVENTS AND REFRESHES PAGE TO SHOW THE EVENT
exports.newAssignments = function(req, res) {
	//converts date
	function convertdate(date) {
		var upDate = new Date(date);
		var m = String(upDate.getMonth() + 1);
		if (m.length === 1) {
			m = "0" + (m);
		}
		var d = String(upDate.getDate());
		if (d.length === 1) {
			d = "0" + d;
		}

		var y = String(upDate.getFullYear());
		return (y + "-" + (m) + "-" + d);
	}

	// gets values to plug into assignment table
	var start = req.body.startdate;
	var end = req.body.duedate;
	start = convertdate(start);
	end = convertdate(end);
	var title = req.body.title;
	var id = Math.random() * (9000 - 1) + 1;

	var description = req.body.descriptiontext;
	var sql = 'INSERT INTO user.assignments (id, title, assigned_date, due_date, class_period_fk, description)'
			+ 'VALUES (?, ?, ?, ?, ?, ?)';
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(
			sql,
			[ id, title, start, end, req.session.periodid, description ],
			function(err, rows, fields) {
				if (err) {
					// connection mess-up handler --> very unlikely as the
					// statement is static and consistent
					res.redirect('/login-failure.html');
				} else {
					// by using a get statement instead of post, the page is
					// easily refreshed by simply plugging in the periodid into
					// the url statement.
					res.redirect('/assignments?classperiodid='
							+ req.session.periodid);
				}
			});

}
// THIS FUNCTION ALLOWS STUDENTS TO SUBMIT FILES AND PUTS THEM IN THE DATABASE
// (HOPEFULLY IT WILL ALSO LOAD ON THE HWQ)
exports.submission = function(req, res) {
	var assignmentId = "";
	var title = "";
	//since most ips are IPV6 there is a '::ffff:' in front of the ip address, next 3 lines removes it
	var IPFromRequest=req.connection.remoteAddress;
    var indexOfColon = IPFromRequest.lastIndexOf(':');
    var ip = IPFromRequest.substring(indexOfColon+1,IPFromRequest.length);
	console.log(ip);
	console.log('Handle upload');
	//initiates busboy
	var busboy = new Busboy({headers : req.headers	});

	var files = [], finished = false;
	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
		console.log('anomally:' + val + " " + fieldname);
		//goes through each field of html form and takes value depending on input type
		if(fieldname === 'title'){
			title = val;
		}else if(fieldname === 'assignmentId'){
			assignmentId = val;
		}
	});

	//when all the .on() functions (request params have been processed) in calendar.submission have finished --> runs this function (submits data into submission mysql)
	busboy.on('finish', function() {
		console.log('busboy finished');
		finished = true;
		//puts data in databse
		unploadDatabase(req, res, assignmentId, title, ip);
	});
	
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

		console.log(filename);

		files.push(filename);

		if (!filename) {
			// If filename is not true it means there's no file
			return;
		}
		// Create the initial array containing the stream's chunks
		file.fileRead = [];

		file.on('data', function(chunk) {
			// Push chunks into the fileRead array
			this.fileRead.push(chunk);
			console.log(".....   ");
			// moves onto next chunk of data
			file.resume();
		});

		file.on('error', function(err) {
			console.log('Error while buffering the stream: ', err);
		});

		file.on('end', function() {

			var userId = req.session.id;

			// Concat the chunks into a Buffer
			var data = Buffer.concat(this.fileRead);

			console.log(data.length + ' of ' + filename + ' arrived');
			console.log("Upload file to S3: " + file + "/" + mimetype);
			// file : { fieldname, originalname, name, encoding, mimetype, path,
			// extension, size, truncated, buffer }
			var params = {
				// bucket = class period id;
				Bucket : 'apcs-dev',
				// gives the url route to the file
				Key : "apcs/p1/" + userId +"_"+ filename,
				ContentType : mimetype,
				Body : data
			};

			s3.putObject(params, function(perr, pres) {
				if (perr) {
					console.log("Error uploading data: ", perr);
				} else {
					console.log("Successfully uploaded data to S3");
					// res.redirect("https://apcs-dev.s3.amazonaws.com/apcs/p1/"+
					// filename);
					lastFilename = "https://apcs-dev.s3.amazonaws.com/apcs/p1/"+ filename;
				}
			});

			// Timeout in 5 seconds to avoid waiting for empty file fields user
			// does not provide in web UI
			setTimeout(function() {
				if (finished) {
					return;
				}
				console.log("Closing...");
				res.redirect("https://apcs-dev.s3.amazonaws.com/apcs/p1/"
						+ files[0]);
			}, 5 * 1000);

		});
	});
	req.pipe(busboy);
	

}
//This function is used in calendar.submission to load the file's data into the mysql submission table.
function unploadDatabase(req, res, assignmentId, title, ipAddress){
	var userId = req.session.id;
	var sql = 'INSERT INTO user.submissions (assignment_id, submission_id, student_id, submit_date, IP_Address, first_name, last_name)'
		+ 'VALUES (?, ?, ?, CURDATE(), ?, ?, ?)';
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(
		sql,
		[ assignmentId, title, userId, ipAddress, req.session.usernameFL[0], req.session.usernameFL[1] ],
		function(err, rows, fields) {
			if (err) {
				// connection mess-up handler --> very unlikely as the
				// statement is static and consistent
				res.redirect('/login-failure.html');
			} else {
				// by using a get statement instead of post, the page is
				// easily refreshed by simply plugging in the periodid into
				// the url statement.
				res.redirect('/assignments?classperiodid='
						+ req.session.periodid);
			}
		});
}