const { Client } = require('pg');

const databasename = "my_database"
const pass= "Noobsarebanned123"; //Change this to match your password
//when making posts check for html tags so they cannot inject javascript

const createDatabase = async () => {
    const client = new Client({ // Makes client object that we connect to
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432
    });
    try {
        await client.connect();                            // gets connection
        let exist = await client.query('SELECT datname FROM pg_database WHERE datname = $1',[databasename]);
        if(exist.rowCount == 0){
            await client.query('CREATE DATABASE '+databasename);
        }
        //flush
    } catch (error) {
        console.error(error.stack);
    } finally {
        await client.end();                                // closes connection
    }
};

const createTable = async () => {
    const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432,
        database: databasename
    })
    try{
        await client.connect();
        await client.query('CREATE TABLE IF NOT EXISTS users ( user_id serial PRIMARY KEY,username VARCHAR (50) NOT NULL,password VARCHAR (50) NOT NULL,email VARCHAR (255) NOT NULL)');
        await client.query('CREATE TABLE IF NOT EXISTS posts ( post_id serial PRIMARY KEY,user_id int NOT NULL,category VARCHAR (30),title VARCHAR (40),post_text VARCHAR (255) NOT NULL,timestamp DATE NOT NULL DEFAULT CURRENT_DATE,FOREIGN KEY (user_id) REFERENCES users (user_id))');  
    } catch (error){
        console.error(error.stack);
    } finally{
        await client.end();
    }
};
// Sets up express web server ---
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
var session = require("express-session");

var app = express();
const port = process.env.PORT || 5000; //This will listen on localhost:5000
// Enables text to be from the html
app.use(bodyParser.urlencoded({extended: false}));

const oneDay = 24* 60* 60* 1000;
// Secret should be array of random strings to stop session hijacking (Secure cookies should also be used)
app.use(session({
    secret: "Session1",
    saveUninitialized: true,
    resave: false,
    cookie: {maxAge: oneDay}
}));

function isAuthenticated (req, res, next) {
    if (req.session.logedin) next()
    else next('route')
  }
  
app.get('/', isAuthenticated, function (req, res) {
    // this is only called when there is an authentication user due to isAuthenticated
    res.sendFile(path.join(__dirname, "index.html"));
})

// When a get request is recieved the html page is returned
app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, "login.html"));
});

// Imports the Style Sheet
app.get('/stylesheet.css', (request, responseC) => {
  responseC.sendFile(path.join(__dirname, "stylesheet.css"))
});

app.post("/logout", express.urlencoded({extended: false}), function(req,res){
    //Check if they are logged in
    if(req.session.logedin){
        //Destroy the session
        req.session.destroy(function(err){
            if (err) return next(err);
            //Send them back to the home page
            res.redirect("/");
        });
    }
});

app.get("/register", (req,res) => {
    res.sendFile(path.join(__dirname, "register.html"));
});

app.get("/createPost", (req,res) => {
    res.sendFile(path.join(__dirname, "createPost.html"));
}); 

app.get("/login",(req,res) =>{
    res.sendFile(path.join(__dirname, "login.html"));
});
app.post("/uploadPost",express.urlencoded({ extended: false }), async (req, res) => {
    const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432,
        database: databasename
    });
    let cat = req.body.BoxSelect;
    let usr = req.session.user;
    let title = req.body.pTitle;
    title = title.toUpperCase();
    let post = req.body.postTextArea;
    let values = [usr,title,cat,post];
    //console.log(usr);
    try{
        await client.connect();
        //Sanatise for javascript and html tags
        await client.query("INSERT INTO posts (user_id,title,category,post_text) VALUES($1,$2,$3,$4)",values);
        res.redirect("/");
    } catch(err){
        console.error(err.stack);
    } finally{
        await client.end();
    }
})
app.post("/login", express.urlencoded({ extended: false }), async (req, res) => {
    if(req.session.logedin){
        res.redirect("/");
    }
    else{
        const pas = req.body.log_password;
        const usr = req.body.log_username;
        const client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: pass,
            port: 5432,
            database: databasename
        });
        try{
            await client.connect();
            //get password
            //hash it
            //query the databse
            const tex = 'SELECT password FROM users WHERE username = $1';
            let res_pass = await client.query(tex,[usr]);
            if(res_pass.rowCount > 0){
                if(res_pass.rows[0]['password'] == pas){
                    req.session.logedin = true;
                    let id = await client.query('SELECT user_id FROM users WHERE username = $1',[usr]);
                    req.session.user = id.rows[0]['user_id'];
                    res.redirect("/");
                }
            }
            else{
                res.sendFile(path.join(__dirname, "incorrectLogin.html"));
            }
        } catch(err){
            console.error(err);
        } finally{
            client.end();
        }
    }
});



app.post("/search", async (req,res) =>{
    let text = req.body.ser_text;
    const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432,
        database: databasename
    });
    try{
        text = text.toUpperCase();
        text = "%"+text+"%";
        await client.connect();
        const quer = 'SELECT * FROM posts WHERE title LIKE $1';
        let result = await client.query(quer,[text]);
        res.write(`<head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title> Developing Secure Software - Blog </title>
        <link rel="stylesheet" href="stylesheet.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
        <link href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css" rel="stylesheet"> <!-- Need for return to top arrow -->
    </head>
    <body>
    
        <button onclick="scrollToTop()" id="reutrnTopButton" title="Go to top" class="icon-chevron-up"></button>
    
        <div class="navBar">
            <div class="container">
                <div class="row">
                    <div class="col-sm-4">
                        <h4 id="title"> Developing Secure Software </h4>
                    </div>
                    <div class="col-sm-4">
                        <!--
                        <h6 id="welcomeUser"> Welcome, User </h6>
                        -->
                    </div>
                    <div class="col-sm-4">
                        <form action="/logout" method="post">
                            <input id="signOut" type="submit" value="Logout">
                        </form>
                    </div>
                </div>
            </div>
        </div>
            
        <div class="main">
            <div class="container">
                <div class="row">
                    <div class="col-sm-12">
                        <form action="/search" method="post">
                            <input class="searchPosts" type="text" placeholder="Search for posts" minlength="3" maxlength="60" id="ser_text" name="ser_text">
                            <button type="submit"><i class="fa fa-search"></i></button>
                        </form>
                        <form action="/createPost" method="get">
                            <br><a><button> Create Post </button></a>
                        </form>
                    </div>
                </div>
                
                <!-- Temporary line breaks -->
                <br><br>
    
                <div class="row">
                    <div class="col-sm-7">
                        <a id=filterText> Filter by category: </a>
                        <div class="dropdown">
                            <button onclick="showDropdown()" id="button" class="dropbtn">Categories</button>
                            <div id="myDropdown" class="dropdown-content">
                              <input type="text" placeholder="Search for a category..." id="myInput" onkeyup="filterDropdown()">
                              <a href="#1" onclick="filterSelection('Category 1')">Category 1</a>
                              <a href="#2" onclick="filterSelection('Category 2')">Category 2</a>
                              <a href="#3" onclick="filterSelection('Category 3')">Category 3</a>
                              <a href="#4" onclick="filterSelection('Category 4')">Category 4</a>
                              <a href="#5" onclick="filterSelection('Category 5')">Category 5</a>
                              <a href="#6" onclick="filterSelection('Category 6')">Category 6</a>
                              <a href="#7" onclick="filterSelection('Category 7')">Category 7</a>
                            </div>
                        </div>
                    </div> 
                    <button id="filterButtonText" onclick="getFilterSelection()"> Filter </button> 
                </div>
    
                <!-- Temporary line breaks -->
                <br><br><br><br><br>
                `);
                
    for(var i=0;i<result.rowCount;i++){
        if(i%2 == 0){
            res.write('<div class="row">');
        }
        res.write('<div id="postBorder" class="col-sm-5">');
        res.write('<h3>'+result.rows[i]['title']+'</h3>');
        res.write('<p>'+result.rows[i]['post_text']+'</p>');
        res.write('<p>'+result.rows[i]['timestamp']+'</p>');
        res.write('</div>');
        if(i%2 == 1 || i == (result.rowCount-1)){
            res.write('</div>');
            res.write('<br><br><br><br><br>');
        }
        
    }
    res.write(`
    <script>
        function showDropdown() {
            document.getElementById("myDropdown").classList.toggle("show");
        }
            
        function filterDropdown() {
            var input, filter, ul, li, a, i;
            input = document.getElementById("myInput");
            filter = input.value.toUpperCase();
            div = document.getElementById("myDropdown");
            a = div.getElementsByTagName("a");
            for (i = 0; i < a.length; i++) {
                txtValue = a[i].textContent || a[i].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                  a[i].style.display = "";
                } else {
                  a[i].style.display = "none";
                }
            }
        }

        function filterSelection(selection) {
            document.getElementById('button').innerText = selection;
            document.getElementById("myDropdown").classList.toggle("show");
        }

        // Posts will then be filtered when clicking the 'Filter' button
        function getFilterSelection() {
            text = document.getElementById('button').innerText;
            console.log(text);
        }

        // Get the button
        let mybutton = document.getElementById("reutrnTopButton");

        // When the user scrolls down 200px from the top of the document, show the button
        window.onscroll = function() {scrollFunction()};

        function scrollFunction() {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            mybutton.style.display = "block";
        } else {
            mybutton.style.display = "none";
          }
        }

        // When the user clicks on the button, scroll to the top of the document
        function scrollToTop() {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }   

    </script>
    
        <!-- Temporary break lines -->
        <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
        
</body>
    `);
    res.end();
    } catch(err){
        console.error(err);
    }finally{
        client.end();
    }
});

// For registration
app.post("/register", express.urlencoded({ extended: false }), async function(req,res) {
    //get the data from the form
    var validflag = 1;
    const username = req.body.rej_username;
    const email = req.body.rej_email;
    const password = req.body.rej_password;

    //DATA sterilisation goes here (CHECK FOR SPECIAL CHARACTERS)
    
    const values = [username,password,email];
    const emailcheck = [email];
    if (validflag == 1 && !req.session.logedin){
        const client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: pass,
            port: 5432,
            database: databasename
        });
        try{
            await client.connect();
            const tex = 'SELECT email FROM users WHERE email = $1';
            let response = await client.query(tex,emailcheck);
            if(response.rows[0] != undefined){
                res.sendFile(path.join(__dirname, "incorrect.html"));
            }
            else{
                // HASHING & SALTING GOES HERE ------------------
                await client.query('INSERT INTO users(username,password,email) VALUES($1,$2,$3)',values);
                let id = await client.query('SELECT user_id FROM users WHERE username = $1',[username]);
                //await res.send("Account created");
                req.session.regenerate(function (err){
                    req.session.logedin = true;
                    req.session.user = id.rows[0]['user_id'];
                    req.session.save(function (err){
                        if(err) return next(err);
                        res.redirect('/');
                    });
                })
    
            }
        }catch(error){
            console.error(error);
        }finally{
            await client.end();
        }
        //could send redirect header or full html page        
    }
});

function sanatise(text){
    var santext = text.replaceAll('"',"");
    santext = santext.replaceAll("/","");
    santext = santext.replaceAll(";","");
    if(santext == text){
        return true;
    }
    else{
        return false;
    }
}

function salt(text){
    const strong = random;
    //Generate strong random number
    //concat with text
    //return text and strong number
    
    return [text, strong];
}

const create = async function(){
    await createDatabase();
    await createTable();
}
create();

app.listen(port);
console.log("Server started at port :" + port);