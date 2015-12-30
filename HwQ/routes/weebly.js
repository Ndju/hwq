var csv = require("fast-csv");
var request = require('request');

console.log( "P1_DATA_URL = "+process.env.P1_DATA_URL );
var P1_DATA_URL = process.env.P1_DATA_URL;

exports.getData = function( callback ){
	request( P1_DATA_URL, function (error, response, body) {
		  if (!error && response.statusCode === 200) {
		    //console.log(body) // Show the HTML for the Google homepage. 
   		    var rows = [];
		    //reads the csv file, each comma seperated section is a new value in an array (header: false means that not read as dictionary)
		    csv.fromString(body, {headers: false})
		    //only reads when there is data
		    .on("data", function(data){
				if (data[0] !== "Date Submitted" && (data[5] !== "" || data[6]!=="" || data[7] !=="")) {
					//the first line on weebly's submission csv file is the column headers, only pushes if not header
					rows.push( data );
				}
		    })
		    //no more data, print on console "done!!!!"
		    .on("end", function(){
		        callback ( rows );
		        console.log("done!!!!");
		    });    
		  }
		});
};

