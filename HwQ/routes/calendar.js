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
		'AND tswbatDB.class.class_id = tswbatDB.owner_table.class_id_fk AND tswbatDB.class.disabled = 0;'; 		
		
		console.log(sql);
		
	}else{
		console.log("user is student")
		var sql = 'SELECT DISTINCT class.class_name, class.class_id, period.period_id, period.period '
			+ 'FROM tswbatDB.student_period, tswbatDB.period, tswbatDB.class '
			+ 'WHERE tswbatDB.student_period.student_id_fk = ? '
			+ 'AND tswbatDB.period.period_id = tswbatDB.student_period.period_id_fk '
			+ 'AND tswbatDB.class.class_id = tswbatDB.period.class_fk '
			+ 'AND tswbatDB.student_period.disabled = 0 AND tswbatDB.class.disabled = 0;';
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
					
					console.log(rows.length);
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
							isTeacher: req.session.is_teacher,
							settings: req.session.settingsList
							
							
						});
						
					}
				}
			});
};
//THIS FUNCTION LOADS THE EVENTS ON A CALENDAR BASED ON WHAT CLASS IS CHOSEN
exports.assignments = function(req, res) {
	// gets the classPeriod list for side bar
	var classPeriodList = req.session.classPeriodList;
	
	if(req.session.is_teacher == 0){
		// creates a list that contains the period id then the class id
		req.session.cpid = req.query.classperiodid.split(",");
		//sets current period id as the period id from cpid
		req.session.periodid = req.session.cpid[0]
		//sets current class id as the class id from cpid
		req.session.classid = req.session.cpid[1];
		//sets the current url
		req.session.urlid = req.session.cpid[0]+"%2C"+req.session.cpid[1]+"%2C"+req.session.cpid[2];
		//sets current period
		req.session.periodnumber = req.session.cpid[2];
	}else{
		//teachers don't give a shit about period id
		req.session.periodid = -1;
		//sets current session class id from query
		req.session.classid = req.query.classperiodid;
		//sets the current url
		req.session.urlid = req.session.classid;
	}
	
	var assignmentList = [];
	//period id and period strings for settings and others
	var settingsList = [];
	//period and id strings for query
	var periodList = [];
	var sql = 'SELECT DATE_FORMAT(assigned_date, \'%Y-%m-%d\') AS assigned_date, title, DATE_FORMAT(due_date, \'%Y-%m-%d\') AS due_date, id, description, class_name, exemption '
			+ 'FROM tswbatDB.assignments, tswbatDB.class WHERE classcode_fk = class_id AND class_id = ?';
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql, [ req.session.classid ],
			function(err, rows, fields) {
				if (err) {
					// connection mess-up handler --> very unlikely as the statement is static and consistent
					res.send('ERROR AT EXPORTS.ASSIGNMENTS');
				} else {
					// for loops through each line of data from mysql
					for (var i = 0; i < rows.length; i++) {
						// each row index = dictionary of values from mysql

						//Format assignment description into HTML for better UI
						var descText = rows[i].description;
						if( req.session.is_teacher == 0){
							descText = descText.split("\n").join("<br/>");
							descText = descText.split("\r").join("");
							descText = descText.split("*").join("<li>");
							//rows[i].description = "<h2>" + descText +"</h2>";
						}else{
							descText = descText.split("\n").join(" *");
							descText = descText.split("\r").join(" *");
							rows[i].description = descText;
						}						
						assignmentList.push(rows[i]);
					}
					var classTitle = "T/SWBAT";
					//extracts the class name chosen by searching through classPeriodList and matching period id
					for(var i = 0; i < classPeriodList.length; i++){
						//if the class_id equivalent to the class_id that the student selected...
						if( classPeriodList[i].class_id === req.session.classid){
							console.log("setting title....")
							//if student, then the title will display the period number along w/ class name.
							if(req.session.is_teacher == 0){
								req.session.periodnumber = classPeriodList[i].period;
								//...then the class name will be displayed as Period x 'classname'
								classTitle = "Period" + " " + req.session.periodnumber +  " " + classPeriodList[i].class_name;
							// if it's a teacher the title will solely display the class name
							}else{
								classTitle = classPeriodList[i].class_name;
							}
							//sets it ass the className;
							req.session.className = classTitle;
						}
					}
					//get settings ids for teacher
					if(req.session.is_teacher == 1){
						var settingSql = 'SELECT period.period, period.period_id FROM tswbatDB.period WHERE class_fk = ?;';
						
						req.app.get('connection').query(settingSql, [ req.session.classid ],
								//change rows to settings to differentiate
								
								function(err, settings, fields) {
									if (err) {
										console.log(err);
										res.send('ERROR AT EXPORTS.ASSIGNMENTS');
									}else{
										//fill up two seperate lists
										for(i=0; i<settings.length; i++){
											settingsList.push("Period "+settings[i].period + " ID: " + settings[i].period_id);
											periodList.push(settings[i]);
										}
										//sets a cookie for later use not now.
										req.session.periodList = periodList;
										//sort the list in period order.
										req.session.settingsList = settingsList.sort();
										
										res.render('calendar', {
											classTitle: classTitle,
											classList : classPeriodList,
											assignmentList : assignmentList,
											isTeacher: req.session.is_teacher,
											settings: settingsList.sort()
										});
										console.log('done');
										
									}
						});
						
						
						
					}else{
					res.render('calendar', {
						classTitle: classTitle,
						classList : classPeriodList,
						assignmentList : assignmentList,
						isTeacher: req.session.is_teacher,
						settings: req.session.settingsList
					
					});
					}
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

	// start date
	var start = req.body.startdate;
	//converts date so it can be plugged into mysql database
	start = convertdate(start);
	console.log('start date: ' + start);

	//end date
	var end = req.body.duedate;
	//converts date so it can be plugged into mysql database
	//end = end.substring(0,4)  + (parseInt(end[4])+1) + end.substring(5,end.length);
	end = convertdate(end);
	console.log('end date: ' + end);
	
	//title
	var title = req.body.title;
	
	//randomly generated assignment_id
	var id = Math.random() * (999999) + 1000;
	
	//randomly generated exemption code from user side
	var exemption = req.body.exemption;
	
	//description text
	var description = req.body.descriptiontext;
	
	var sql = 'INSERT INTO tswbatDB.assignments (id, title, assigned_date, due_date, classcode_fk, description, exemption)'
			+ 'VALUES (?, ?, ?, ?, ?, ?, ?)';
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(sql,[id, title, start, end, req.session.classid, description, exemption],
			function(err, rows, fields) {
				if (err) {
					// connection mess-up handler --> very unlikely as the
					// statement is static and consistent
					console.log('Sql error: ' + err);
					res.redirect('/login-failure.html');
				} else {
					// by using a get statement instead of post, the page is
					// easily refreshed by simply plugging in the periodid into
					// the url statement.
					res.redirect('/assignments?classperiodid='
							+ req.session.urlid);
				}
			});

}

// THIS FUNCTION ALLOWS STUDENTS TO SUBMIT FILES AND PUTS THEM IN THE DATABASE
// (HOPEFULLY IT WILL ALSO LOAD ON THE HWQ)
exports.submission = function(req, res) {
	var assignmentId = "";
	var title = "";
	console.log('Handling upload');
	//initiates busboy
	var busboy = new Busboy({headers : req.headers});

	var files = [], finished = false;
	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
		console.log('anomally:' + val + " " + fieldname);
		//goes through each field of html form and takes value depending on input type
		if(fieldname === 'title'){
			console.log('title: ' + val);
			title = val;
		}else if(fieldname === 'assignment_id'){
			console.log('assignment_id: ' + val);
			assignmentId = val;
		}
	});

	//when all the .on() functions (request params have been processed) in calendar.submission have finished --> runs this function (submits data into submission mysql)
	busboy.on('finish', function() {
		console.log('busboy finished');
		finished = true;
		//puts data in databse
		unploadDatabase(req, res, assignmentId, title, files);
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
			console.log(".....");
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
function unploadDatabase(req, res, assignmentId, title, files){

	console.log(assignmentId);
	console.log( 'files::::::> '+ files);
	
	var urlNames = [" "," "," "];
	for(var i = 0; i<files.length; i++){
		urlNames[i] = "https://apcs-dev.s3.amazonaws.com/" + req.session.periodid + "/" + req.session.id + "_" + files[i];
	}
	var sql = 'INSERT INTO tswbatDB.submissions (assignment_id, submission_id, date_submitted, student_id, first_name, last_name, file1_url, file2_url, file3_url, period_number)'
		+ 'VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)';
	console.log(assignmentId)
	// creates the connection with mysql database and executes statement.
	req.app.get('connection').query(
		sql,
		[ assignmentId, title, req.session.id, req.session.first, req.session.last, urlNames[0], urlNames[1], urlNames[2], req.session.periodnumber],
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
						+ req.session.urlid);
			}
		});
}
exports.editAssignment = function(req, res){
	console.log(req.body);
	var start = convertdate(req.body.start);
	var end = convertdate(req.body.end);
	var sql = "UPDATE tswbatDB.assignments SET title = ?, assigned_date = ?, due_date = ?, description = ?, exemption = ? WHERE id = ?";
	req.app.get('connection').query(sql,[req.body.title_assignment, start, end, req.body.descriptiontext, req.body.exemption, req.body.assignmentId],
			function(err, rows, fields){
		if(err){
			res.send('SQL Error ' + err);
		}else{
			res.redirect('/assignments?classperiodid='
					+ req.session.urlid);
		}
	})
}

exports.remove = function(req, res){
	
}
