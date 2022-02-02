function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkAuthenticatedBoolean(req, res, next) {
  if (req.isAuthenticated()) {
    return true;
  }
}

module.exports = {
  checkNotAuthenticated,
  checkAuthenticated,
};
