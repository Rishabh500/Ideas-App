const express = require('express');
const path = require('path');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
var methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
// var client = require('twilio')('ACd24666f14b64284b91868bc76e166e02','abbee068902492aab706ac82eb08bf9e');

const app = express();

//passport config
require('./config/passport')(passport);

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
// Connect to mongoose
mongoose.connect('mongodb://localhost/vidjot-dev', {
  useMongoClient: true
})
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

  // Load user model
require('./models/User');
const User = mongoose.model('users');
// Load Idea Model
require('./models/Idea');
const Idea = mongoose.model('ideas');
//Flash
app.use(flash());

// Handlebars Middleware
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//Method Override Middleware
app.use(methodOverride('_method'));

//static folder
app.use(express.static(path.join(__dirname,'public')));

//Express Session middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));


//Global variable
app.use(function(req,res,next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('errorr');
    next();
});

// Index Route
app.get('/', (req, res) => {
  const title = 'Welcome';
  res.render('index', {
    title: title
  });
});

// About Route
app.get('/about', (req, res) => {
  res.render('about');
});

// //Twilio
// app.get('/testtwilio',(req,res)=>{
//   client.messages.create({
//     from: '+15202144859',
//     to: '+919654869125',
//     body: "Hi Rishabh.."
//   }).then((messsage) => console.log(message.sid));
// });
//Idea Index Page
app.get('/ideas',(req,res)=>{
  Idea.find({})
    .sort({date:'desc'})
    .then(ideas => {
      res.render('ideas/index',{
        ideas:ideas
      });
    });
});

// Add Idea Form
app.get('/ideas/add', (req, res) => {
  res.render('ideas/add');
});

// Edit Idea Form
app.get('/ideas/edit/:id', (req, res) => {
  Idea.findOne({
    _id:req.params.id
     })
  .then(idea=>{
    res.render('ideas/edit',{
      idea:idea
    });
  });
});

// Process Form
app.post('/ideas', (req, res) => {
  let errors = [];

  if(!req.body.title){
    errors.push({text:'Please add a title'});
  }
  if(!req.body.details){
    errors.push({text:'Please add some details'});
  }

  if(errors.length > 0){
    res.render('ideas/add', {
      errors: errors,
      title: req.body.title,
      details: req.body.details
    });
  } else {
    const newUser = {
      title: req.body.title,
      details: req.body.details
    }
    new Idea(newUser)
      .save()
      .then(idea => {
        req.flash('success_msg','Idea Added');
        res.redirect('/ideas');
      })	
  }
});

//Edit Form Process
app.put('/ideas/:id',(req,res)=>{
  Idea.findOne({
    _id:req.params.id
  })
  .then(idea=>{
    //new values
    idea.title = req.body.title;
    idea.details = req.body.details;

    idea.save()
      .then(idea=>{
        req.flash('success_msg','Idea Updated');
        res.redirect('/ideas')
      })
  });
});

//Delete Req
app.delete('/ideas/:id',(req,res)=>{
  Idea.remove({_id:req.params.id})
  .then(()=>{
    req.flash('success_msg','Idea removed');
      res.redirect('/ideas');
  });
});
const port = 5000;

app.listen(port, () =>{
  console.log(`Server started on port ${port}`);
});

app.get('/login',(req,res)=>{
  res.render('users/login');
});
app.get('/register',(req,res)=>{
  res.render('users/register');
});

//Register form post
app.post('/register',(req,res)=>{
  let errors = [];
  if(req.body.password != req.body.password1){
    errors.push({text:'Passwords do not match'});
  }
  if(req.body.password.length<4){
    errors.push({text:'Password must be atleast 4 characters'});
  }
  if(errors.length>0){
    res.render('users/register',
    {
      error:errors,
      name:req.body.name,
      email:req.body.email,
      number:req.body.number,
      password:req.body.password,
      password1:req.body.password1
    });
  }
  else{
    User.find({email:req.body.email})
    .then(email  => {
      if(email){
          req.flash('error_msg','Email is already registered..');
          res.redirect('/register');
        }
        else{
          const newUser = new User({
            name:req.body.name,
            email:req.body.email,
            phonenumber:req.body.number,
            password:req.body.password
          });
         bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(newUser.password,salt,(err,hash)=>{
                if(err) throw err;
                newUser.password = hash;
                newUser.save()
                  .then(user=>{
                    // req.flash('success_msg','You are now registered and can log in');
                    // res.redirect('/users/login');
                    req.flash('success_msg','User added, Please log in..');
                    res.redirect('/login');
                  })
                  .catch(err=>{
                    console.log(err);
                    return;
                  });
            });
         });
        }      
    });
    // User.find({phonenumber:req.body.number})
    // .then(num  => {
    //   if(num){
    //       req.flash('error_msg','Number already registered..');
    //       res.redirect('/register');
    //     }
    // });
   
  
  }
});

//Login form post
app.post('/login',(req,res,next)=>{
  passport.authenticate('local',{
    successRedirect:'/ideas',
    failureRedirect:'/login',
    failureFlash:true
  })(req,res,next);
});