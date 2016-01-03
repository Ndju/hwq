var express = require('express');
var app = express();
var aws = require("aws-sdk");



app.use(express.static('public'));
app.use(express.methodOverride());
app.use(app.router);

var Busboy = require('busboy');

var AWS_ACCESS_KEY = 'AKIAJ2UZTZQI3RXHVP6Q'; //process.env.AWS_SECRET_KEY;
var AWS_SECRET_KEY =  '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';// process.env.AWS_ACCESS_KEY;
var S3_BUCKET = 'apcs-dev'; // process.env.S3_BUCKET
aws.config.update({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY
    });
var s3 = new aws.S3();

app.post('/upload', function(req, res){
	console.log('Handle upload');
    var lastFilename = "";
    
    var busboy = new Busboy({ headers: req.headers });
    
    var files = [], finished = false;
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
	    console.log(fieldname, val);
	});
	
    
    busboy.on('finish', function() {
	  console.log('busboy finished');
      finished = true;
      res.redirect("https://apcs-dev.s3.amazonaws.com/apcs/p1/"+ files[0]);
    });
    
    	
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    
       console.log( filename );
    
       files.push(filename); 
    
	    if (!filename) {
	      // If filename is not truthy it means there's no file
	      return;
	    }
	    // Create the initial array containing the stream's chunks
	    file.fileRead = [];
	
	    file.on('data', function(chunk) {
	      // Push chunks into the fileRead array
	      this.fileRead.push(chunk);
	      console.log(".....   ");
	      file.resume();
	    });
	
	    file.on('error', function(err) {
	      console.log('Error while buffering the stream: ', err);
	    });
	
	    file.on('end', function() {
	    
	      // Concat the chunks into a Buffer
	      var data = Buffer.concat(this.fileRead);
	
		    console.log(data.length + ' of ' + filename + ' arrived');
		    console.log( "Upload file to S3: " + file + "/" + mimetype );
		    // file : { fieldname, originalname, name, encoding, mimetype, path, extension, size, truncated, buffer }
		    var params = {
		      Bucket: S3_BUCKET,
		      Key: "apcs/p1/"+filename,
		      ContentType : mimetype,
		      Body: data
		    };
		
		    s3.putObject(params, function (perr, pres) {
		      if (perr) {
		        console.log("Error uploading data: ", perr);
		      } else {
		        console.log("Successfully uploaded data to S3");
		        //res.redirect("https://apcs-dev.s3.amazonaws.com/apcs/p1/"+ filename);
		        lastFilename = "https://apcs-dev.s3.amazonaws.com/apcs/p1/"+ filename;
		      }
		    });
		    
		    //Timeout in 5 seconds to avoid waiting for empty file fields user does not provide in web UI
	        setTimeout(function () {
	            if( finished ){
	              return;
	            }
		        console.log("Closing...");
		        res.redirect("https://apcs-dev.s3.amazonaws.com/apcs/p1/"+ files[0]);
	        }, 5 * 1000);
		    
		    
	    });
	  });
	  
	  req.pipe( busboy );
	  
	  

});

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

}) 