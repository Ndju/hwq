var csv = require("fast-csv");
var request = require('request');

console.log( "P1_DATA_URL = "+process.env.P1_DATA_URL );
var P1_DATA_URL = process.env.P1_DATA_URL;

exports.getData = function( callback ){
	request( P1_DATA_URL, function (error, response, body) {
		  if (!error && response.statusCode === 200) {
		    //console.log(body) // Show the HTML for the Google homepage. 
   		    var rows = [];
		    
		    csv.fromString(body, {headers: false})
		    .on("data", function(data){
				if (data[0] !== "Date Submitted") {
					rows.push( data );
				}
		    })
		    .on("end", function(){
		        callback ( rows );
		        console.log("done!!!!");
		    });    
		  }
		});
};

