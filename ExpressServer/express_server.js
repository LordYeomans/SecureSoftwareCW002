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

// Imports the Style Sheet
app.get('/stylesheet.css', (request, responseC) => {
  responseC.sendFile(path.join(__dirname, "stylesheet.css"))
});

function sanatise(things){
  var charCount = 0;
  while(charCount < things.length){
    if(things.charAt(charCount).toUpperCase() == "S"){
      charCount++;
      if(things.charAt(charCount).toUpperCase() == "E"){
        charCount++;
        if(things.charAt(charCount).toUpperCase() == "L"){
          charCount++;
          if(things.charAt(charCount).toUpperCase() == "E"){
            charCount++;
            if(things.charAt(charCount).toUpperCase() == "C"){
              charCount++;
              if(things.charAt(charCount).toUpperCase() == "T"){
                return false;
              }
            }
          }
        }
      }
    }
    charCount++;
  }
  charCount = 0;
  while(charCount < things.length){
    if(things.charAt(charCount).toUpperCase() == "C"){
      charCount++;
      if(things.charAt(charCount).toUpperCase() == "R"){
        charCount++;
        if(things.charAt(charCount).toUpperCase() == "E"){
          charCount++;
          if(things.charAt(charCount).toUpperCase() == "A"){
            charCount++;
            if(things.charAt(charCount).toUpperCase() == "T"){
              charCount++;
              if(things.charAt(charCount).toUpperCase() == "E"){
                return false;
              }
            }
          }
        }
      }
    }
    charCount++;
  }
  charCount = 0;
  while(charCount < things.length){
    if(things.charAt(charCount).toUpperCase() == "D"){
      charCount++;
      if(things.charAt(charCount).toUpperCase() == "R"){
        charCount++;
        if(things.charAt(charCount).toUpperCase() == "O"){
          charCount++;
          if(things.charAt(charCount).toUpperCase() == "P"){
            return false;
          }
        }
      }
    }
    charCount++;
  }
  charCount = 0;
  while(charCount < things.length){
    if(things.charAt(charCount).toUpperCase() == "T"){
      charCount++;
      if(things.charAt(charCount).toUpperCase() == "A"){
        charCount++;
        if(things.charAt(charCount).toUpperCase() == "B"){
          charCount++;
          if(things.charAt(charCount).toUpperCase() == "L"){
            charCount++;
            if(things.charAt(charCount).toUpperCase() == "E"){
              return false;
            }
          }
        }
      }
    }
    charCount++;
  }
  var charCount = 0;
  while(charCount < things.length){
    if(things.charAt(charCount).toUpperCase() == "I"){
      charCount++;
      if(things.charAt(charCount).toUpperCase() == "N"){
        charCount++;
        if(things.charAt(charCount).toUpperCase() == "S"){
          charCount++;
          if(things.charAt(charCount).toUpperCase() == "E"){
            charCount++;
            if(things.charAt(charCount).toUpperCase() == "R"){
              charCount++;
              if(things.charAt(charCount).toUpperCase() == "T"){
                return false;
              }
            }
          }
        }
      }
    }
    // Clear out other SQL keywords
    // DROP, FROM, TABLE, UNION, JOIN, INSERT, INTO, CREATE, SELECT  
    // DROP, TABLE, SELECT, CREATE, INSERT

    charCount++;
  }
  return true;
}  


// When a post request is recieved
app.post("/submit-data", function(req,res) {
  //Fetch data from post form request to then pass to database
  //Will need to query to figure out if it exists or not
  //Input needs to be sanatised before it is passed to database

  var first =  req.body.firstName;
  first = first.replaceAll("'","");
  first = first.trim();
  var last =  req.body.lastName;
  last = last.replaceAll("'","");
  last = last.trim();
  var name = first + " " + last;
  
  
  if(sanatise(name)){
    res.send(name + " Submitted Successfully");
  }
  else{
    res.send("NO");
  }
  
  
  //Once all sanatisation has occured, the database will need to be queried to see if that account already exists
  //Delay the response so that the timing is consistant (without noticably slowing down the log in process)

  
});

//This tells the server to listen on the configured port
app.listen(port);


console.log("Server started at port :" +port);