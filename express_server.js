var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;  //default port 8000


app.set("view engine", "ejs");


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// const cookieParser = require("cookie-parser");
// app.use(cookieParser());
const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["hello"]
}));

const bcrypt = require("bcrypt");


//urlDatabase
const urlDatabase = {
    "b2xVn2": {
      "b2xVn2": "http://www.lighthouselabs.ca",
      "userID": "userRandomID"
    },

    "9sm5xK": {
      "9sm5xK": "http://www.google.com",
      "userID": "user2RandomID"
    }
  };


const users = {
  "userRandomID": {
      id: "userRandomID",
      email: "user@example.com",
      password: "$2b$10$6efRUaGeV64j3I8dCpirr.I4wc1fuNm6FyeemWclZo3SACJR5dSdK"
    },

   "user2RandomID": {
      id: "user2RandomID",
      email: "user2@example.com",
      password: "$2b$10$l27cJydcZuwp.efFHZKZIeBXX4dWBpr7PMrpYdBTGiLxODWjkqOwm"
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
      urlObj["longURL"] = urlDatabase[key][key];
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


//function returning subset of urlDatabase for specific user id
function urlsForUser(id) {
  let tempUrlDatabase = {};
    for(var key in urlDatabase) {
      if(urlDatabase[key]["userID"] == id) {
        tempUrlDatabase[key] = urlDatabase[key];
      }
    }
  return tempUrlDatabase;
}



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

  //getting subset of the urlDatabase for current user logged in
  let tempUrlDatabase = urlsForUser(req.session.user_id);


  //getting user object for user_id (user_id from request cookie)
  let userObj = getUserObject(req.session.user_id);  //getting user id from user_id cookies

  let templateVars = { urls: tempUrlDatabase,
                      hostUrl: hostUrl,
                      user: userObj
                    };
  res.render("urls_index", {templateVars: templateVars});
});


app.post("/urls", (req, res) => {
  //console.log(req.body);  //debug statement to see POST parameters

  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();

  let tempUrlObj = {};
  tempUrlObj[newShortURL] = newLongURL;
  tempUrlObj["userID"] = req.session.user_id;

  urlDatabase[newShortURL] = tempUrlObj;
  res.redirect('/urls');
});


app.get("/urls/new", (req, res) => {

  //getting user object for user_id (user_id from request cookie)
  if(req.session.user_id) {

    let userObj = getUserObject(req.session.user_id);  //getting user id from user_id cookies

    let templateVars = {user: userObj};
    res.render("urls_new", {templateVars: templateVars});
  } else {
    res.redirect("/login");
  }
});


//delete urls
app.post("/urls/:id/delete", (req, res) => {
  if(req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');   //redirecting to index page
  } else {
    res.redirect("/login");
  }

});



app.get("/urls/:id", (req, res) => {

  if(req.session.user_id) {

    //checking if short url belongs to the current user or not
    //if it belongs to the current user, then only will show

    let flag = 0;   //assuming :id (shorturl) doesn't belong to current user

    let tempUrlDatabase = urlsForUser(req.session.user_id);

    for(let key in tempUrlDatabase) {
      if(key == req.params.id) {
        flag = 1;
        break;
      }
    }

    if(flag == 1) {
      let hostUrl = req.protocol +"://" +  req.hostname + ":" + PORT;
      let templateVarsNew = { shortURL: req.params.id };

      let urlObj = getFullURLObject(templateVarsNew.shortURL);

      //getting user object for user_id (user_id from request cookie)
      let userObj = getUserObject(req.session.user_id);  //getting user id from user_id cookies
      let templateVars = {user: userObj};

      res.render("urls_show", {urlObj: urlObj, hostUrl: hostUrl, templateVars: templateVars});
    } else {
      let page = "<h3 align='center'>ShortKey doesn't exist for current user!</h3>";
      page += "<p align='center'><a href='/urls'>Goto Homepage</a></p>";
      res.send(page);
    }
  } else {
    res.redirect("/login");
  }
});


app.post("/urls/:id", (req, res) => {
  if(req.session.user_id) {
    urlDatabase[req.params.id][req.params.id] = req.body.longNewUrl;
    res.redirect('/urls');
  } else {
    res.redirect("/login");
  }
});


app.get("/u/:shortURL", (req, res) => {
  //let longURL = ...
  let shortUrl = req.params.shortURL;
  let longURL = undefined;

  let flag = 0;   //assume that the short key is not in urlDatabase
  for(let key in urlDatabase) {
    if(key == shortUrl) {
      flag = 1;
      break;
    }
  }

  if(flag == 1) {
    longURL = urlDatabase[shortUrl][shortUrl];   //taken from urlDatabase object
  }

  if(longURL) {
    res.redirect(longURL);
  } else if(longURL == undefined){
    res.statusCode = 301;

    var page = "<h3 align='center'>Error - " + res.statusCode + ": Page Not Fond</h3>";
    page += "<p align='center'><a href='/urls'>Goto Homepage</a></p>";
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

    if(bcrypt.compareSync(password, userObj.password)) {
      //Login successfull Here
      let user_id = userObj.id;

      req.session.user_id = user_id;

      res.redirect("/");
    } else {
      res.statusCode = 403;
      res.statusCode = 403;
      let page = "<h3 align='center'>Error " + res.statusCode + ": ";
      page += "Incorrect Username/Password!</h3>";
      page += "<p align='center'><a href='/login'>Goto Login Page...</a></p>";
      res.send(page);
    }
  } else {
    res.statusCode = 403;
    let page = "<h3 align='center'>Error " + res.statusCode + ": ";
    page += "Incorrect Username/Password!<h3>";
    page += "<p align='center'><a href='/login'>Goto Login Page...</a></p>";
    res.send(page);
  }

});

app.post("/signout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if(req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render('urls_register');
  }
});


app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;



  let id = generateRandomString();

  //checking if the email/password fields are empty and sending back the responses
  if(!email || !password || email == "" || password == "") {
    let page = "";
    res.statusCode = 400;
    page += "<h3 align='center'>Error " + res.statusCode + ": Email or Password fields are empty!</h3>";
    page += "<p align='center'><a href='/register'>Goto Register Form</a></p>";
    res.send(page);
  } else if(isUserAlreadyExists(email)) {
    //checking if the user email already exists
    let page = "";
    res.statusCode = 400;
    page += "<h3 align='center'>Error " + res.statusCode + ": User with email " + email + " already exists!</h3>";
    page += "<p align='center'><a href='/register'>Goto Register Form</a></p>";
    res.send(page);
  } else {
    //Encrypting password
    password = bcrypt.hashSync(password, 10);
    //registering user by adding it to users global object
    //and setting user id to user_id session

    users[id] = { id: id, email: email, password: password };

    req.session.user_id = id;
    res.redirect("/urls");
  }
});

var server = app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});