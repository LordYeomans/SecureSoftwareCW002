const { Client } = require('pg');

const databasename = "my_database"

const client = new Client({ // Makes client object that we connect to
    host: 'localhost',
    user: 'postgres',
    password: 'Noobsarebanned123',
    port: 5432
});



const createDatabase = async () => {
    try {
        await client.connect();                            // gets connection
        await client.query('CREATE DATABASE '+databasename, (err) => {
            if (err){
                //console.log(err.stack);
                //console.log("Ignoring the error");
            }
        }); // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return true;
    } finally {
        await client.end();                                // closes connection
        return true;
    }
};

const createTable = async () => {
    try{
        const client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: 'Noobsarebanned123',
            port: 5432,
            database: databasename
        })
        await client.connect();
        await client.query('CREATE TABLE users ( user_id serial PRIMARY KEY,username VARCHAR (50) NOT NULL,password VARCHAR (50) NOT NULL,email VARCHAR (255) NOT NULL)');
        await client.query('CREATE TABLE posts ( post_id serial PRIMARY KEY,user_id serial NOT NULL,post_text VARCHAR (255) NOT NULL,timestamp DATE NOT NULL DEFAULT CURRENT_DATE,FOREIGN KEY (user_id) REFERENCES users (user_id))');
    } catch (error){
        //console.error(error.stack);
        return false;
    } finally{
        await client.end();
        return true;
    }
};
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
    res.sendFile(path.join(__dirname, "test1.html"));
});
/*
// Imports the Style Sheet
app.get('/stylesheet.css', (request, responseC) => {
  responseC.sendFile(path.join(__dirname, "stylesheet.css"))
});
*/

// For registration
app.post("/submit-data", async function(req,res) {
    //get the data from the form
    var validflag = 1;
    const username = req.body.rej_username;
    const email = req.body.rej_email;
    const password = req.body.rej_password;
    const emailcheck = [email];
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
    if (validflag == 1){
        try{
            const client = new Client({
                host: 'localhost',
                user: 'postgres',
                password: 'Noobsarebanned123',
                port: 5432,
                database: databasename
            });
            await client.connect();
            const tex = 'SELECT email FROM users WHERE email = $1';
            let response = await client.query(tex,emailcheck);
            console.log(response.rows[0]);
            if(response.rows[0]['email'] == email){
                res.send("NO");
            }
            else{
                //console.log("else");
                // HASHING & SALTING GOES HERE ------------------
                await client.query('INSERT INTO users(username,password,email) VALUES($1,$2,$3)',values);
                await res.send("Account created");
            }
        }catch(error){
            console.error(error);
        }finally{
            await client.end();
        }
    }
});



createDatabase();
createTable(); 



app.listen(port);
console.log("Server started at port :" +port);
