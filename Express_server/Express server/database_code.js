const { Client } = require('pg');

const client = new Client({ // Makes client object that we connect to
    host: 'localhost',
    user: 'postgres',
    password: 'Noobsarebanned123',
    port: 5432
});

const databasename = "my_database"

const createDatabase = async () => {
    try {
        await client.connect();                            // gets connection
        await client.query('CREATE DATABASE '+databasename, (err) => {
            if (err){
                //console.log(err.stack);
                console.log("Ignoring the error");
            }
        }); // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
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
        await client.query('CREATE TABLE posts ( post_id serial PRIMARY KEY,user_id serial NOT NULL,post_text VARCHAR (255) NOT NULL,FOREIGN KEY (user_id) REFERENCES users (user_id))');
    } catch (error){
        console.error(error.stack);
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
    res.sendFile(path.join(__dirname, "index.html"));
});

// Imports the Style Sheet
app.get('/stylesheet.css', (request, responseC) => {
  responseC.sendFile(path.join(__dirname, "stylesheet.css"))
});

createDatabase().then((result) => {
    if (result) {
        console.log('Database created');
    }
});

createTable().then((result) => {
    if(result){
        console.log('Table Created')
    }
})


app.listen(port);
console.log("Server started at port :" +port);
