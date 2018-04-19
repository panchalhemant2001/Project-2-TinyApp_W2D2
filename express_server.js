var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;  //default port 8000


//urlDatabase
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


const users = {
  "userRandomID": {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    },
   "user2RandomID": {
      id: "user2RandomID",
      email: "user2@example.com",
      password: "dishwasher-funk"
    }
};


//Genrate a random string of length = 6
function generateRandomString() {
  var text = "";
  var length = 6;

  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


//Function returning url object containing URL & short URL for short URL passed to it
function getFullURLObject(shortURL) {
  var urlObj = {};

  for(var key in urlDatabase) {
    if(key === shortURL) {
      urlObj["shortURL"] = key;
      urlObj["longURL"] = urlDatabase[key];
    }
  }
  return urlObj;
}

//function returning true if user with same email exists
function isUserAlreadyExists(email) {
  let result = false;
  for(let usr in users) {
    if(users[usr].email == email) {
      result = true;
      break;
    }
  }
  return result;
}



//function returning user object for user id passed to it
function getUserObject(userid) {
  let userObj = undefined;

  for(let usr in users) {

    if(userid == users[usr].id) {
      userObj = users[usr];
      break;
    }
  }
  return userObj;
}


//function returning user object for user email passed to it
function getUserObjectByEmail(email) {
  let userObj = undefined;

  for(let usr in users) {

    if(email == users[usr].email) {
      userObj = users[usr];
      break;
    }
  }
  return userObj;
}




app.set("view engine", "ejs");


const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());




app.get("/", (req, res) => {
  res.redirect('/urls');
});




app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {

  let hostUrl = req.protocol +"://" +  req.hostname + ":" + PORT;
  //console.log(hostUrl);

  //getting user object for user_id (user_id from request cookie)
  let userObj = getUserObject(req.cookies.user_id);  //getting user id from user_id cookies


  let templateVars = { urls: urlDatabase, hostUrl: hostUrl, user: userObj};
  res.render("urls_index", {templateVars: templateVars});
});


app.post("/urls", (req, res) => {
  //console.log(req.body);  //debug statement to see POST parameters

  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();

  urlDatabase[newShortURL] = newLongURL;

  res.redirect('/urls');
});




app.get("/urls/new", (req, res) => {

//getting user object for user_id (user_id from request cookie)
  let userObj = getUserObject(req.cookies.user_id);  //getting user id from user_id cookies

  let templateVars = {user: userObj};
  res.render("urls_new", {templateVars: templateVars});
});


//delete urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');   //redirecting to index page
});



app.get("/urls/:id", (req, res) => {

  let hostUrl = req.protocol +"://" +  req.hostname + ":" + PORT;
  let templateVarsNew = { shortURL: req.params.id };
  let urlObj = getFullURLObject(templateVarsNew.shortURL);

//getting user object for user_id (user_id from request cookie)
  let userObj = getUserObject(req.cookies.user_id);  //getting user id from user_id cookies
  let templateVars = {user: userObj};

  res.render("urls_show", {urlObj: urlObj, hostUrl: hostUrl, templateVars: templateVars});

});


app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longNewUrl;
  res.redirect('/urls');
});


app.get("/u/:shortURL", (req, res) => {
  //let longURL = ...
  let longURL = urlDatabase[req.params.shortURL];   //taken from urlDatabase object
  if(longURL) {
    res.redirect(longURL);
  } else if(longURL == undefined){
    res.statusCode = 301;

    var page = "<h1>Error - " + res.statusCode + ": Page Not Fond</h1>";
    page += "<a href='/urls'>Goto Homepage</a>";
    res.send(page);
  }
});


app.get("/login", (req, res) => {
  res.render('urls_login');
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;



  let userObj = getUserObjectByEmail(email);

  if(userObj) {

    if(password == userObj.password) {
      //Login successfull Here
      let user_id = userObj.id;

      res.cookie("user_id", user_id);
      res.redirect("/");
    } else {
      res.statusCode = 403;
      let page = "Error " + res.statusCode + ": ";
      page += "Incorrect Password!";
      page += "<a href='/login'>Goto Login Page...</a>";
      res.send(page);
    }
  } else {
    res.statusCode = 403;
    let page = "Error " + res.statusCode + ": ";
    page += "User with email id " + email + "cannot be found!";
    page += "<a href='/login'>Goto Login Page...</a>";
    res.send(page);
  }

});

app.post("/signout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render('urls_register');
});


app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = generateRandomString();

  //checking if the email/password fields are empty and sending back the responses
  if(!email || !password || email == "" || password == "") {
    let page = "";
    res.statusCode = 400;
    page += "Error " + res.statusCode + ": Email or Password fields are empty!";
    page += "<br><a href='/register'>Goto Register Form</a>";
    res.send(page);
  } else if(isUserAlreadyExists(email)) {
    //checking if the user email already exists
    let page = "";
    res.statusCode = 400;
    page += "Error " + res.statusCode + ": User with email " + email + " already exists!";
    page += "<br><a href='/register'>Goto Register Form</a>";
    res.send(page);
  } else {
    //registering user by adding it to users global object
    //and setting user id to user_id cookie
    users[id] = { id: id, email: email, password: password };
    res.cookie("user_id", id);
    //console.log(users);
    res.redirect("/urls");
  }
});

var server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});