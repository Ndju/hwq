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
	console.log('id:' + req.session.id);
	var assignmentList = [];
	//initializes list of information to be rendered on calendar.ejs
	var classPeriodList = [];
	//this statement goes through database to draw out class name and class period_id and period.
	if(req.session.is_teacher == 1){
		console.log("user is teacher")
		var sql = 'SELECT DISTINCT tswbatDB.class.class_name, tswbatDB.class.class_id '  + 
		'FROM tswbatDB.class, tswbatDB.owner_table WHERE tswbatDB.owner_table.owner_id = ? ' + 
		'AND tswbatDB.class.class_id = tswbatDB.owner_table.class_id_fk;';
	}else{
		console.log("user is teacher")
		var sql = 'SELECT DISTINCT class.class_name, period.period_id, period.period '
			+ 'FROM tswbatDB.student_period, tswbatDB.period, tswbatDB.class '
			+ 'WHERE tswbatDB.student_period.student_id_fk = ? '
			+ 'AND tswbatDB.period.period_id = tswbatDB.student_period.period_id_fk '
			+ 'AND tswbatDB.class.class_id = tswbatDB.period.class_fk;';
	}
	//creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [ req.session.id ],
			function(err, rows, fields) {
				if (err) {
					//connection mess-up handler --> very unlikely as the statement is static and consistent
					res.send('Failed to retrieve class information for user');
				} else {
					var classperiodid = req.session.periodid;
					// for loops through each line of data from mysql
					console.log(rows.length)
					for (var i = 0; i < rows.length; i++) {
						console.log(rows[i])
						classPeriodList.push(rows[i]);
					}
					req.session.classPeriodList = classPeriodList;
					
					if( classperiodid != -1 ){
						//Load the calendar for first class found
						res.redirect("assignments?classperiodid=" + classperiodid );
					//no classes so just show this
					}else{
						console.log('sending to calendar');
						res.render('calendar', { /*
													 * Put the code that passes
													 * variables to homepage so that
													 * computer can get user's files
													 * for the calendar here. check
													 * submissions for this)
													 */
							classTitle: "T/SWBAT",
							assignmentList : assignmentList,
							classList : classPeriodList,
							isTeacher: req.session.is_teacher
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
	
	//Simple calculation of class id based on class period id.
	//The classperiod id is constructed from [CLASS_ID][period] 
	var classid =  req.query.classperiodid;
	classid = classid.substring(0,  classid.length-1);
	req.session.classid = classid;
	var assignmentList = [];
	var sql = 'SELECT DATE_FORMAT(assigned_date, \'%Y-%m-%d\') AS assigned_date, title, DATE_FORMAT(due_date, \'%Y-%m-%d\') AS due_date, id, description, class_name '
			+ 'FROM tswbatDB.assignments, tswbatDB.class WHERE classcode_fk = class_id AND class_id = ?';
	console.log(sql + "\n===>" + req.session.classid );
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [ req.session.classid ],
			function(err, rows, fields) {
				if (err) {
					// connection mess-up handler --> very unlikely as the
					// statement is static and consistent
					res.send('ERROR AT EXPORTS.ASSIGNMENTS');
				} else {
					console.log(rows.length)
					// for loops through each line of data from mysql
					for (var i = 0; i < rows.length; i++) {
						// each row index = dictionary of values from mysql

						//Format assignment description into HTML for better UI
						var descText = rows[i].description;
						if( req.session.is_teacher == '0' ){
							descText = descText.split("\n").join("<br/>");
							descText = descText.split("\r").join("");
							descText = descText.split("*").join("<li>");
							rows[i].description = "<h2>" + descText +"</h2>";
						}else{
							descText = descText.split("\n").join(" *");
							descText = descText.split("\r").join(" *");
							rows[i].description = descText;
						}						
						assignmentList.push(rows[i]);
					}
					var classTitle = "NA";
					//extracts the class name chosen by searching through classPeriodList and matching period id
					for(var i = 0; i < classPeriodList.length; i ++ ){
						//if the periodid (turned into string) is equal the the class period that the student selected...
						if( classPeriodList[i].period_id.toString() === req.query.classperiodid){
							console.log("setting title....")
							req.session.periodnumber = classPeriodList[i].period;
							//...then the class name will be displayed as Period x 'classname'
							classTitle = "Period" + " " + classPeriodList[i].period +  " " + classPeriodList[i].class_name;
						}
					}
					console.log(classTitle)
					
					res.render('calendar', {
						classTitle: classTitle,
						classList : classPeriodList,
						assignmentList : assignmentList,
						isTeacher: req.session.is_teacher
					});
				}
			});
}
//function converts date mm/dd/yyyy --> mysql usable
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
// THIS FUNCTION CREATES NEW EVENTS AND REFRESHES PAGE TO SHOW THE EVENT
exports.newAssignments = function(req, res) {
	//converts date so it can be plugged into mysql database
	

	// gets values to plug into assignment table
	var start = req.body.startdate;
	var end = req.body.duedate;
	end = end.substring(0,4)  + (parseInt(end[4])+1) + end.substring(5,end.length);
	start = convertdate(start);
	end = convertdate(end);
	var title = req.body.title;
	var id = Math.random() * (9000 - 1) + 1;
	var classCode = req.session.classid;

	var description = req.body.descriptiontext;
	var sql = 'INSERT INTO tswbatDB.assignments1 (id, title, assigned_date, due_date, classcode_fk, description)'
			+ 'VALUES (?, ?, ?, ?, ?, ?)';
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(
			sql,
			[ id, title, start, end, req.session.classid, description ],
			function(err, rows, fields) {
				if (err) {
					// connection mess-up handler --> very unlikely as the
					// statement is static and consistent
					res.send('ERROR AT EXPORTS.NEWASSIGNMENTS');
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
		}else if(fieldname === 'assignment_id'){
			console.log('HEREEEE: ' + val);
			assignmentId = val;
		}
	});

	//when all the .on() functions (request params have been processed) in calendar.submission have finished --> runs this function (submits data into submission mysql)
	busboy.on('finish', function() {
		console.log('busboy finished');
		finished = true;
		//puts data in databse
		unploadDatabase(req, res, assignmentId, title, ip, files);
	});
	
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

		console.log(filename);
		//if the data input is a file, push the name of the file into the files array --> used to construct bucket url.
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
				Key : req.session.periodid + "/" + userId +"_"+ filename,
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
function unploadDatabase(req, res, assignmentId, title, ipAddress, files){
	var userId = req.session.id;
	console.log(assignmentId);
	console.log( 'files:::::: '+files );
	
	var urlNames = [" "," "," "];
	for(var i = 0; i<files.length; i++){
		urlNames[i] = "https://apcs-dev.s3.amazonaws.com/" + req.session.periodid + "/" + userId + "_" + files[i];
	}
	var sql = 'INSERT INTO tswbatDB.submissions1 (assignment_id, submission_id, date_submitted, student_id, IP_Address, first_name, last_name, file1_url, file2_url, file3_url)'
		+ 'VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)';
	console.log(assignmentId)
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(
		sql,
		[ assignmentId, title, userId, ipAddress, req.session.usernameFL[0], req.session.usernameFL[1], urlNames[0], urlNames[1], urlNames[2]],
		function(err, rows, fields) {
			if (err) {
				// connection mess-up handler --> very unlikely as the
				// statement is static and consistent
				res.send('SQL Error ' + err);
			} else {
				// by using a get statement instead of post, the page is
				// easily refreshed by simply plugging in the periodid into
				// the url statement.
				res.redirect('/assignments?classperiodid='
						+ req.session.periodid);
			}
		});
}
exports.editAssignment = function(req, res){
	console.log(req.body);
	var start = convertdate(req.body.start);
	var end = convertdate(req.body.end);
	var sql = "UPDATE tswbatDB.assignments1 SET title = ?, assigned_date = ?, due_date = ?, description = ? WHERE id = ?";
	req.app.get('connection').query(sql,[req.body.title_assignment, start, end, req.body.descriptiontext, req.body.assignmentId],
			function(err, rows, fields){
		if(err){
			res.send('SQL Error ' + err);
		}else{
			res.redirect('/assignments?classperiodid='
					+ req.session.periodid);
		}
	})
}

exports.remove = function(req, res){
	console.log(req.body.removeclass)
	var sql = "DELETE FROM tswbatDB.student_period WHERE student_id_fk = ? and period_id_fk = ?";
	console.log("delete this");
	req.app.get('connection').query(sql,[req.session.id, req.body.removeclass],
			function(err, rows, fields){
		if(err){
			res.send('SQL Error ' + err);
		}else{
			console.log("delete this");
			res.redirect('/calendar');
		}
	})
}
