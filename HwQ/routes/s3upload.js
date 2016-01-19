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


exports.doUpload = function(req, res) {
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
		console.log("Finished upload [" +  ip +"]" + files);
		res.redirect("https://s3-us-west-2.amazonaws.com/apcs-dev/10011/206_"+files[0] );
	});
	
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

		console.log("Receiving file " + filename);
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

			console.log(data.length + 'bytes of ' + filename + ' received.');
			console.log("Upload file to S3: " + filename + "/" + mimetype);
			// file : { fieldname, originalname, name, encoding, mimetype, path,
			// extension, size, truncated, buffer }
			var params = {
				// bucket = class period id;
				Bucket : 'apcs-dev',
				// gives the url route to the file
				Key :  "10011/206_" + filename,
				ContentType : mimetype,
				Body : data
			};

			s3.putObject(params, function(perr, pres) {
				if (perr) {
					console.log("Error uploading data: ", perr);
				} else {
					console.log("Successfully uploaded "+ filename + " to S3");
				}
			});

			// Timeout in 5 seconds to avoid waiting for empty file fields user
			// does not provide in web UI
			setTimeout(function() {
				if (finished) {
					return;
				}
				console.log("Timeout waiting for 5 seconds, closing connection...");
				res.redirect("https://s3-us-west-2.amazonaws.com/apcs-dev/10011/206_" + files[0]);
			}, 5 * 1000);

		});
	});
	req.pipe(busboy);
	

};
