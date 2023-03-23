// Sets up express web server ---
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

var app = express();
const port = process.env.PORT || 5000; //This will listen on localhost:5000
// ----

// Enables text to be from the html
app.use(bodyParser.urlencoded({extended: false}));

// When a get request is recieved the html page is returned
app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, "index.html"));
});


// When a post request is recieved
app.post("/submit-data", function(req,res) {
  //Fetch data from post form request to then pass to database
  //Will need to query to figure out if it exists or not
  //Input needs to be sanatised before it is passed to database

  //Strips ' out of the firstname and lastname
  var first =  req.body.firstName;
  first = first.replaceAll("'","");
  first = first.trim();

  var last =  req.body.lastName;
  last = last.replaceAll("'","");
  last = last.trim();
  var name = first + " " + last;
  
  var charCount = 0;
  while(charCount < name.length){
    if(name.charAt(charCount).toUpperCase() == "S"){
      charCount++;
      if(name.charAt(charCount).toUpperCase() == "E"){
        charCount++;
        if(name.charAt(charCount).toUpperCase() == "L"){
          charCount++;
          if(name.charAt(charCount).toUpperCase() == "E"){
            charCount++;
            if(name.charAt(charCount).toUpperCase() == "C"){
              charCount++;
              if(name.charAt(charCount).toUpperCase() == "T"){
                res.send("NO");
                //Do something to deny the request and get them to retry
                //Should probably send them back to Index.html but with a warning added to the body stating that those characters are not allowed
                //Send something to client side to then let JQuery script handle to change html
              }
            }
          }
        }
      }
    }
    charCount++;
  }
  //Once all sanatisation has occured, the database will need to be queried to see if that account already exists
  
  res.send(name + " Submitted Successfully");
});

//This tells the server to listen on the configured port
app.listen(port);


console.log("Server started at port :" +port);