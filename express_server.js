var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;  //default port 8000


//urlDatabase
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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




app.set("view engine", "ejs");


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());





app.get("/", (req, res) => {
  //res.end("Hello!");
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
  let templateVars = { urls: urlDatabase, hostUrl: hostUrl };
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
  res.render("urls_new");
});


//delete urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');   //redirecting to index page
});



app.get("/urls/:id", (req, res) => {
  let hostUrl = req.protocol +"://" +  req.hostname + ":" + PORT;
  let templateVars = { shortURL: req.params.id };
  let urlObj = getFullURLObject(templateVars.shortURL);
  res.render("urls_show", {urlObj: urlObj, hostUrl: hostUrl});

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


var server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});