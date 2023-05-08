const { Client } = require('pg');

const databasename = "my_database"
const pass= "Noobsarebanned123"; //Change this to match your password
//when making posts check for html tags so they cannot inject javascript

const testHarnes = async () => {
    // Should output 2 messages to console with no errors
    //createDatabase();
    //createTable();

    //salting
    var t = "hello"
    t = salt(t,1);
    console.log(t); // output should be 1hello
    //hashing
    t = hash(t);
    console.log(t); // output should be 88fdd585121a4ccb3d1540527aee53a77c77abb8
    //encryption
    t = encrypt(t);
    console.log(t); // output should be 3b3747e6e7eb406b4d51f386d7bb0bc986f4eda4055f4eb5cd85ff5b78b04706ae39ea21befc8f025a897d9ffbe3b01b
    t = "<script>this is a script</script>";
    t = escape(t);
    console.log(t); // output should be &lt;script&gt;this is a script&lt;/script&gt;
}

const createDatabase = async () => {
    const client = new Client({ // Makes client object that we connect to
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432
    });
    try {
        await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));                   // gets connection
        let exist = await client.query('SELECT 1 FROM pg_database WHERE datname = $1',[databasename]);
        if(exist.rowCount == 0){
            await client.query('CREATE DATABASE '+databasename).then(() => console.log("Database was successfully created")).catch((error) => console.error(error));
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
        await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));
        await client.query('CREATE TABLE IF NOT EXISTS users ( user_id serial PRIMARY KEY,username VARCHAR (97) UNIQUE NOT NULL,password VARCHAR (97) NOT NULL,email VARCHAR (255) UNIQUE NOT NULL,csrf VARCHAR(50))').then(() => console.log("User table was successfully created")).catch((error) => console.error(error));
        await client.query('CREATE TABLE IF NOT EXISTS posts ( post_id serial PRIMARY KEY,user_id int NOT NULL,category VARCHAR (30),title VARCHAR (40),post_text VARCHAR (512) NOT NULL,timestamp DATE NOT NULL DEFAULT CURRENT_DATE,FOREIGN KEY (user_id) REFERENCES users (user_id))').then(() => console.log("Post table was successfully created")).catch((error) => console.error(error));  
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
const jsSHA = require("jssha");
var session = require("express-session");
var crypto = require("crypto");

var app = express();
const port = process.env.PORT || 5000; //This will listen on localhost:5000
// Enables text to be from the html
app.use(bodyParser.urlencoded({extended: false}));

const oneDay = 24* 60* 60* 1000;
//const oneDay = 3* 60* 1000;
// Secret should be array of random strings to stop session hijacking (Secure cookies should also be used)
/*
app.use(session({
    secret: "Session1",
    saveUninitialized: true,
    resave: false,
    cookie: {maxAge: oneDay},
    cookie: {secure: true }
}));
*/
app.use(session({
    genid: function(req) {
      return genuuid() // use UUIDs for session IDs
    },
    secret: 'Session1',
    saveUninitialized: true,
    resave: false,
    cookie: {maxAge: oneDay},
    cookie: {secure: true }
}))
app.set('trust proxy', 1) // trust first proxy


function isAuthenticated (req, res, next) {
    if (req.session.logedin) next()
    else next('route')
  }

app.get('/', isAuthenticated, function (req, res) {
    // this is only called when there is an authentication user due to isAuthenticated
    //res.sendFile(path.join(__dirname, "2FA.html"));

    console.log("Session 2fa: "+req.session.fa);

    if (req.session.fa == true) {
        res.sendFile(path.join(__dirname, "index.html"));
    }
    //check source of request ---------------------------------------------------------------
    //if src of request is from login send to 2FA.html
    //else send to 2FAregister.html
    else if(req.session.log == true){
        res.sendFile(path.join(__dirname, "2FA.html"));
        req.session.log = undefined;
    } else {
        res.sendFile(path.join(__dirname, "2FAregister.html"));
    } 
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

// -------------------- QR CODE --------------------
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');

var secret = speakeasy.generateSecret({
    name: "Blog - Developing Secure Software"
})

console.log(secret);

qrcode.toDataURL(secret.otpauth_url, function(err, data){
    //console.log(data);
})

app.post("/twoFaLogin", express.urlencoded({ extended: false }), async function(req,res) {
    
    console.log("Here!");

    const token = req.body.twoFaPassword;
    const id = req.session.user;
    console.log(token);
    var secret = "";
    //Code to get secret from db
    const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432,
        database: databasename
    })
    /*
    try{
        await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));
        secret = await client.query('SELECT secret FROM users WHERE user_id = $1',[id]);
        secret = secret.rows[0]['secret'];
    } catch(err){

    } finally{

    }
    */
    var verified = speakeasy.totp.verify({
        secret: ',0k1fUcuRguC@b@>il%&B0BT%v#&2UFa', // ascii: ''
        encoding: 'ascii',
        token: token // Code generated on phone
    })

    //console.log(verified);

    if (verified == true) {
        req.session.fa = true;
        res.sendFile(path.join(__dirname, "index.html"));
    } else {
        console.log("Failed 2FA!")
    }
});

// -------------------- X --------------------

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
    try{
        await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));
        await client.query("INSERT INTO posts (user_id,title,category,post_text) VALUES($1,$2,$3,$4)",values);
        res.redirect("/");
    } catch(err){
        console.error(err.stack);
    } finally{
        await client.end();
    }
});
app.post("/login", express.urlencoded({ extended: false }), async (req, res) => {
    if(req.session.logedin){
        res.redirect("/");
    }
    else{
        var pas = req.body.log_password;
        var usr = req.body.log_username;
        const client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: pass,
            port: 5432,
            database: databasename
        });
        try{
            //Get current time
            let start = Date.now();
            //Connect to db
            await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));
            //Randomly generate salt
            let randsalt = Math.round(Math.random() * (10000 - 1) + 1);
            //encrypt username
            usr = encrypt(usr);
            //Query for user Id 
            const id = await client.query('SELECT user_id FROM users WHERE username = $1',[usr]);
            //If found salt
            if(id.rowCount > 0){
                pas = salt(pas,id.rows[0]['user_id']);
                pas = hash(pas);
            }
            //If not found use random salt
            else{
                pas = salt(pas,randsalt.toString());
                pas = hash(pas);
            }
            pas = encrypt(pas); // encrypt the password
            let result = await client.query('SELECT 1 FROM users WHERE username = $1 AND password = $2',[usr,pas]);
            //SELECT 1 FROM users WHERE username = $1 AND password = $2
            //Use result of that to log in (will only return 1 if the username and password exist in a single record)
            if(result.rowCount > 0){
                req.session.logedin = true;
                req.session.log = true; //represents where the request to 2FA is coming from
                req.session.user = id.rows[0]['user_id'];
                res.redirect("/");
            }
            else{
                req.session.loginattempt++;
            }
            if(req.session.loginattempt > 9){
                res.write(`
                <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title> Developing Secure Software - Login </title>
    <link rel="stylesheet" href="stylesheet.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css"/>
</head>
<body style="background-color: rgb(223, 223, 223);">

    <div class="navBar">
        <div class="container">
            <div class="row">
                <div class="col-sm-4">
                    <h4 id="title"> Developing Secure Software </h4>
                </div>
            </div>
        </div>
    </div>

    <div class="main">
        <div class="container">
            <h1> LOGIN </h1>
            <p> Please enter your Username and Password!</p>
            <div class="box">
                <div class="row">
                    <div class="col-sm-12">
                        <form id="myForm" action="/login" method="post" >
                            <label for="log_username">Username</label><br>
                            <input type="text" id="log_username" name="log_username" required><br><br>
                            <label for="log_password">Password</label><br>
                            <input type="text" id="log_password" name="log_password" required minlength="8"><br><br>
                            <input type="submit" value="Submit"  class="formSubmitBtn">
                        </form>
                        <form action="/register" method="get"><br>
                            <p> Don't have an account? <input type="submit" value="Sign Up" class="formBoldBtn"> </p> 
                        </form>
                        <p id="incorrectText"> Too many tries </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
                `)
            }
            else if(result.rowCount < 1){
                res.sendFile(path.join(__dirname, "incorrectLogin.html"));
            }
            let end = Date.now();
            console.log("time taken = "+(end-start));
        } catch(err){
            console.error(err);
        } finally{
            client.end();
        }
    }
});
//html encode < >

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
        await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));
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
    
                <!-- Temporary line breaks -->
                <br><br><br><br><br>
                `);
                
    for(var i=0;i<result.rowCount;i++){
        if(i%2 == 0){
            res.write('<div class="row">');
        }

        title = escape(result.rows[i]['title']);
        text = escape(result.rows[i]['post_text']);
        let time =result.rows[i]['timestamp'];

        res.write('<div id="postBorder" class="col-sm-5">');
        res.write('<h3>'+title+'</h3>');
        res.write('<p>'+text+'</p>');
        res.write('<p>'+time+'</p>');
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
    var username = req.body.rej_username;
    var email = req.body.rej_email;
    var password = req.body.rej_password;
    username = encrypt(username);
    email = encrypt(email);
    var values = [username,password,email];
    if (!req.session.logedin){
        const client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: pass,
            port: 5432,
            database: databasename
        });
        try{
            await client.connect().then(() => console.log("Client connected")).catch((error) => console.error(error));
            
            const tex = 'SELECT email FROM users WHERE email = $1';
            let response = await client.query(tex,[email]);
            let response2 = await client.query('SELECT username FROM users WHERE username = $1',[username]);
            if(response.rows[0] != undefined || response2.rows[0] != undefined){
                res.sendFile(path.join(__dirname, "incorrect.html"));
            }
            else{
                let previd = await client.query('SELECT user_id FROM users ORDER BY user_id DESC');
                
                if(previd.rowCount < 1){
                    previd = 0;
                }
                else{
                    previd = previd.rows[0]['user_id'];
                }
                password = salt(password,(previd)+1); // salt the password
                password = hash(password); // hash the password
                password = encrypt(password); //encrypt the password
                
                values[1] = password;
                let csrf = req.body.csrf;
                console.log(csrf);
                //if the csrf is printing correctly then uncomment the command below and comment out the one under that (the one that looks very similar)
                //values[3] = csrf; <----- uncomment this
                //await client.query('INSERT INTO users(username,password,email,csrf) VALUES($1,$2,$3,$4),values); <----- uncomment this
                await client.query('INSERT INTO users(username,password,email) VALUES($1,$2,$3)',values); // <----- comment this out
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

function escape(tet) {
    let lookup = {
        '&': "&amp;",
        '"': "&quot;",
        '\'': "&apos;",
        '<': "&lt;",
        '>': "&gt;"
    };
    return tet.replace( /[&"'<>]/g, c => lookup[c] );
};

function hash(text){
    const shaObj = new jsSHA("SHA-1", "TEXT", { encoding: "UTF8" });
    shaObj.update(text);
    return shaObj.getHash("HEX");
}

function encrypt(text){
    var key = crypto.createCipher("aes-128-cbc","tempkey");
    var str = key.update(text,'utf8','hex');
    text = str+key.final('hex');
    return text;
    
}

function decrypt(cipher){
    var key = crypto.createDecipher('aes-128-cbc','tempkey');
    var str = key.update(cipher,'hex','utf8');
    str +=key.final('utf8');
    return str;
    
}

function salt(text, salt){
    return text + salt;
}

const create = async function(){
    await createDatabase();
    await createTable();
}
create();
var https = require("https");
var fs = require("fs");
https.createServer(
    {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert")
    },
    app
    ).listen(port)
//app.listen(port);
//testHarnes();
console.log("Server started at port :" + port);