# Developing Secure Software CW 2 - UEA Year 3
## Secure Development Project and Presentation  

[Trello Board](https://trello.com/b/yLVC8BuY/dss2022-23-002-ug06)

**Overview**  
>The aim of this assignment is for your group to code a secure usable webbased blog system that mitigates, at minimum, the five most common
security vulnerabilities of account enumeration, session hijacking, SQL
injection, cross-site scripting, and cross site request forgery.  
  
**Dependancies**  
>This project uses *node.js* and the following node packages:
- express
- jssha
- body-parser
- crypto
- pg
- speakeasy
- qrcode
>These can be downloaded once you have node using the command *npm install **package name***.


**Run Code**
>Before you can run the code you will need to make sure that you have a postgreSQL databse running on port 5432.
>
>Open the *Database_code.js* file and change the pass variable (near the top of the code) to the password to your database.
>
>To run the code open up a terminal like cmd and run the command *node **Database_code.js***.
>This should host the server at *localhost:5000*.






