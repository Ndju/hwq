var csv = require("fast-csv");
var request = require('request');

exports.getData = function( req, callback ){
	var DATA_URL = process.env.P1_DATA_URL;
	console.log( "Loading APCS data for " + req.session.APCS_PERIOD );
	if ( req.session.APCS_PERIOD === "P2" ){
		 DATA_URL = process.env.P2_DATA_URL;	
	}
	console.log( "DATA_URL = " + DATA_URL );

	request( DATA_URL, function (error, response, body) {
		  if (!error && response.statusCode === 200) {
		    //console.log(body) // Show the HTML for the Google homepage. 
   		    var rows = [];
		    //reads the csv file, each comma seperated section is a new value in an array (header: false means that not read as dictionary)
		    csv.fromString(body, {headers: false})
		    //only reads when there is data
		    .on("data", function(data){
				if (data[0] !== "Date Submitted" && (data[0].indexOf("2016")>0 ) && (data[5] !== "" || data[6]!=="" || data[7] !=="")) {
					//the first line on weebly's submission csv file is the column headers, only pushes if not header
					//console.log("ROW = " + data[0]);
					rows.push( data );
				}
		    })
		    //no more data, print on console "done!!!!"
		    .on("end", function(){
		    	console.log("Total submission rows found " + rows.length );
		        callback ( rows );
		        console.log("done!!!!");
		    });    
		  }
		});
};

