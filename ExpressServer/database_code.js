const { Client } = require('pg');

const databasename = "my_database"
const pass= "Noobsarebanned123"; //Change this to match your password


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
        const client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: pass,
            port: 5432,
            database: databasename
        })
        await client.connect();
        await client.query('CREATE TABLE IF NOT EXISTS users ( user_id serial PRIMARY KEY,username VARCHAR (50) NOT NULL,password VARCHAR (50) NOT NULL,email VARCHAR (255) NOT NULL)');
        await client.query('CREATE TABLE IF NOT EXISTS posts ( post_id serial PRIMARY KEY,user_id serial NOT NULL,post_text VARCHAR (255) NOT NULL,timestamp DATE NOT NULL DEFAULT CURRENT_DATE,FOREIGN KEY (user_id) REFERENCES users (user_id))');  
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

app.post("/register", (req,res) => {
    res.sendFile(path.join(__dirname, "register.html"));
});

app.post("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

// For registration
app.post("/submit-data", express.urlencoded({ extended: false }), async function(req,res) {
    //get the data from the form
    var validflag = 1;
    const username = req.body.rej_username;
    const email = req.body.rej_email;
    const password = req.body.rej_password;

    //DATA sterilisation goes here (CHECK FOR SPECIAL CHARACTERS)
    if(sanatise(email)){
        emailcheck = [email];
    }
    else{
        res.send("Invalid email");
        return;
    }
    const values = [username,password,email];
    if (password == ""){
        res.send("Need password");
        validflag = 0;
    }
    if(username == ""){
        res.send("Need username");
        validflag = 0;
    }
    if(email ==""){
        res.send("Need email");
        validflag = 0;
    }
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
            console.log(response.rows[0]);
            if(response.rows[0] != undefined){
                res.sendFile(path.join(__dirname, "incorrect.html"));
            }
            else{
                // HASHING & SALTING GOES HERE ------------------
                await client.query('INSERT INTO users(username,password,email) VALUES($1,$2,$3)',values);
                //await res.send("Account created");
                req.session.regenerate(function (err){
                    req.session.logedin = true;
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

async function search(req,res,text){
    const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: pass,
        port: 5432,
        database: databasename
    });
    try{
        const tex = req.bodyParser.ser_text;
        await client.connect();
        const quer = 'SELECT * FROM posts WHERE category LIKE $1';
        let result = await client.query(quer,[tex]);
        return result.rows;
    } catch(err){
        console.err(err);
    }finally{
        client.end();
    }
}

const create = async function(){
    await createDatabase();
    await createTable();
}
create();

app.listen(port);
console.log("Server started at port :" + port);