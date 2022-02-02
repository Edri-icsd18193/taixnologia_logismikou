require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const JUser = require("../models/JUser");
const bcrypt = require("bcryptjs");
const {
  checkAuthenticated,
  checkNotAuthenticated,
} = require("../middlewares/auth");

const app = express();

const initializePassport = require("../passport-config");
initializePassport(
  passport,
  async (email) => {
      const userFound = await JUser.findOne({
        email
      });
      return userFound;
    },
    async (id) => {
      const userFound = await JUser.findOne({
        _id: id
      });
      return userFound;
    }
);

app.set("view engine", "ejs");
app.use(express.urlencoded({
  extended: true
}));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(express.static("public"));

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index", {
    name: req.user.name
  });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render('login', { role: req.session.role})
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", checkNotAuthenticated, async (req, res) => {
  const userFound = await JUser.findOne({
    email: req.body.email
  });

  if (userFound) {
    req.flash("error", "User with that email already exists");
    res.redirect("/register");
  } else {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new JUser({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });

      await user.save();
      res.redirect("/login");
    } catch (error) {
      console.log(error);
      res.redirect("/register");
    }
  }
});

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});


// const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://Aldo:aldo123@cluster0.35kk7.mongodb.net/Cluster0?retryWrites=true&w=majority', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
mongoose.Promise = global.Promise;
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

app.listen(process.env.PORT || 3000)
