const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const dotenv = require('dotenv');

dotenv.config();

const userService = require('./user-service.js');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

/* TODO Add Your Routes Here */

// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// Configure its options - in One object
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_SECRET; //env var

// Boilerplate with 2 options above
var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log('payload received', jwt_payload);

  if (jwt_payload) {
    // The following will ensure that all routes using
    // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values
    // that matches the request payload data
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName
      // fullName: jwt_payload.fullName,
      // role: jwt_payload.role,
      // customMessage: "Hello"
    });
  } else {
    next(null, false);
  }
});
// Configure passport to use our JWT Strategy
passport.use(strategy);
// Initialize passport middleware
app.use(passport.initialize());
//----------------------------------------------------------------------------------
app.post('/api/user/login', (req, res) => {
  userService
    .checkUser(req.body)
    .then(user => {
      var payload = {
        _id: user._id,
        userName: user.userName
      };
      let token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 60 * 60 });

      res.json({ message: 'login successful', token: token });
    })
    .catch(msg => {
      res.status(422).json({ message: msg });
    });
});

app.post('/api/user/register', (req, res) => {
  userService
    .registerUser(req.body)
    .then(msg => {
      res.json({ message: msg });
    })
    .catch(msg => {
      res.status(422).json({ message: msg });
    });
});

// GET
app.get('/api/user/favourites', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    let data = await userService.getFavourites(req.user._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// PUT
app.put('/api/user/favourites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    let data = await userService.addFavourite(req.user._id, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// DELETE
app.delete('/api/user/favourites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    let data = await userService.removeFavourite(req.user._id, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.use((req, res) => {
  res.status(404).end();
});
//----------------------------------------------------------------------------------
userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log('API listening on: ' + HTTP_PORT);
    });
  })
  .catch(err => {
    console.log('unable to start the server: ' + err);
    process.exit();
  });
