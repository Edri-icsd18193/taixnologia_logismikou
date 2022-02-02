require("dotenv").config();
const express = require("express")
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Pelatis = require("./models/pelatis");
const DVD = require('./models/dvd')

const {
  checkAuthenticated,
  checkNotAuthenticated,
} = require("./middlewares/auth");


// ------------Routers-----------------
const indexRouter = require('./routes/index')
const authorRouter = require('./routes/authors')
const bookRouter = require('./routes/books')
const dvdRouter = require('./routes/dvds')
const pelatisRouter = require('./routes/pelates')
const adminRouter = require('./routes/admin')

//--------------------------------------------------------------------

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  async (email) => {
      const userFound = await Pelatis.findOne({
        email
      });
      return userFound;
    },
    async (id) => {
      const userFound = await Pelatis.findOne({
        _id: id
      });
      return userFound;
    }
);
//--------------------------------------------------------------------



app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
// app.set('layout', 'layouts/layout')
// app.use(expressLayouts)
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
  limit: '10mb',
  extended: true
}))

//---------------------
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
//------------------------



//---------------------------Mongoose----------------------------------
const mongoose = require('mongoose');
const res = require("express/lib/response");
mongoose.connect('mongodb+srv://Aldo:aldo123@cluster0.35kk7.mongodb.net/Cluster0?retryWrites=true&w=majority', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
mongoose.Promise = global.Promise;
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))
//---------------------------End Mongoose-------------------------------

// app.use('/', indexRouter)
app.use('/authors', authorRouter)
app.use('/books', bookRouter)
app.use('/dvds', dvdRouter)
app.use('/Pelates', pelatisRouter, checkNotAuthenticated)
app.use('/admin', adminRouter)

const Book = require('./models/book')
app.get('/', async (req, res) => {
  let query = DVD.find()
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'))
  }
  try {
    const dvds = await query.sort({ publishDate: 'desc' }).limit(6).exec()
    res.render('index', {
      dvds: dvds,
      role: req.session.role
    })
  } catch {
    res.redirect('/')
  }
})



app.get("/login", checkNotAuthenticated, async (req, res) => {
  try {
    res.render("logins/login", {
      user: req.user,role: req.session.role
    });
  } catch(err) {
    console.log(err);
  }
});

app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true,
}), (req, res) => {
  console.log("email:"+req.user.email)
  if(req.user.email=="admin@gmail.com"){
    req.session.role = "Admin";
  }else{
    req.session.role = "User"; // this will be based on the login
  }
  res.redirect("/")
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("logins/register", {role: req.session.role});
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  const userFound = await Pelatis.findOne({
    email: req.body.email
  });
  var errorMessage;
  var error=true;
  if(!req.body.name.trim().length){
    errorMessage="Enter name";
    error=false;
  }else if(!req.body.surname.trim().length){
    errorMessage="Enter surname";
    error=false;
  }else if(!req.body.address.trim().length){
    errorMessage="Enter address";
    error=false;
  }else if(!req.body.email.trim().length){
    errorMessage="Enter email";
    error=false;
  }else if (userFound) {
    errorMessage="User with that email already exists";
    error=false;
  }else if(!req.body.password.trim().length){
    errorMessage="Enter email";
    error=false;
  }
  if(error){
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new Pelatis({
        name: req.body.name,
        surname: req.body.surname,
        address: req.body.address,
        email: req.body.email,
        password: hashedPassword,
      });

      await user.save();
      res.redirect("/login");
    } catch (error) {
      console.log(error);
      res.redirect("/register");
    }
  }else{
    req.flash("error", errorMessage);
    req.flash("name", req.body.name.trim());
    req.flash("surname", req.body.surname.trim());
    req.flash("address", req.body.address.trim());
    req.flash("email", req.body.email.trim());
    req.flash("password", req.body.password.trim());
    res.redirect("/register");
  }
});

app.delete("/logout", (req, res) => {
  req.logOut();
  req.session.role = 'Guest'
  res.redirect("/");
});



app.listen(process.env.PORT || 3000)