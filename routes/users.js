var express = require('express');
var mongoose = require('mongoose');
var User = require('../models/users');
var bodyParser = require('body-parser');
var passport = require('passport');
var authenticate = require('../authenticate');
var cors = require('./cors');
var router = express.Router();

/* GET users listing. */
router.use(bodyParser.json());
router.options('*',cors.corsWithOptions , (req,res) => { res.statusCode = 200; console.log('entercors');})
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({}).then((users) =>{
    res.statusCode = 200;
    res.setHeader('Content-Type' , 'application/json');
    res.json(users);
  }, (err) => next(err))
  .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions, function(req, res, next){
  User.register(new User({username : req.body.username}),
    req.body.password, (err , user) =>{
      if(err){
        res.statusCode = 500;
        res.setHeader('Content-type' , 'applicatuion/json');
        res.json({err : err});
     }
      else{
        if(req.body.firstname)
          user.firstname = req.body.firstname;
        if(req.body.lastname)
          user.lastname = req.body.lastname;
        user.save((err , user) =>{
          if(err){
            res.statusCode = 500;
            res.setHeader('Content-type' , 'applicatuion/json');
            res.json({err : err});
            return;            
          }
          passport.authenticate('local')(req, res, () =>{
            res.statusCode = 200;
            res.setHeader('Content-Type' , 'application/json');
            res.json({success: true , status : 'Registration Successful'});
        }); 
        });
  
    }
  });
});

router.post('/login' , cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('local' , (err , user , info) => {
    if(err){
      return next(err);
    }
    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type' , 'application/json');
      res.json({success: false , status : "Login Unsuccessful!" , err : info});
    }
    req.logIn(user , (err) => {
      if(err){
        return next(err);
      }
      var token = authenticate.getToken({_id : req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type' , 'application/json');
      
      //res.header('Access-Control-Allow-Origin' ,'http://localhost:4200')
      res.json({success: true , token : token ,status : 'Login Successful!'});
    });
  })(req, res, next)
});

router.get('/logout' , cors.corsWithOptions, (req , res, next) =>{
  if(req.session){
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else{
    var err = new Error('You are not logged in!')
    err.status = 403;
    return next(err);
  }
});

router.get('/checkJWTtoken' ,cors.corsWithOptions, (req, res, next) => {
    passport.authenticate('jwt' , {session : false}, (err, user, info) =>{
        if(err){
          return next(err);
        }
        if(!user){
          res.statusCode=401;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: false , status : 'JWT invalid!',err:info})
        }
        else{
          res.statusCode = 200;
          res.setHeader('Content-Type' , 'application/json');
          res.json({success : true , status : 'JWT valid!', user : user});
        }
    }) (req, res, next);
});

router.get('/facebook/token', 
passport.authenticate('facebook-token'), (req, res) => {
    if(req.user){
      var token = authenticate.getToken({_id : req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type' , 'application/json');
      res.json({success: true , token : token ,status : 'You are successfully logged in'});
    }
});
module.exports = router;
