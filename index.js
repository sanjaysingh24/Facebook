import express  from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import session from "express-session";
import passport from "passport";
import passportfacebook from "passport-facebook";
import 'dotenv/config';
import mongoose, { mongo } from "mongoose";
const app = express();
const port = process.env.PORT||3000;

const FacebookStrategy =passportfacebook.Strategy;


//crete session
app.use(session({
    secret:'baba',
    resolve:false,
    saveUninitialized:true,
    cookie:{secure:false,maxAge:3000}
}))


//initialize the passport
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
main().catch((err)=>{
    console.log(err);
})


//connect mongodb
async function main(){
    await mongoose.connect("mongodb://localhost:27017/Facebook");
    console.log("connect successfully");
}

//create a userschema for mongodb to store the data of facebook
const userschema = new mongoose.Schema({
    facebookId:String,
    Name:String,
    provider:String
})

// create a model
const User = mongoose.model('User',userschema);


//  now for authentication
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.SECRET,
    callbackURL: "http://localhost:4000/auth/facebook/callback"
  },
 async function(accessToken, refreshToken, profile, cb) {
   const user =await User.findOne({
    facebookId:profile.id,
    provider:'facebook',
   });
   if(!user){
    console.log("Adding  new user to db..");
    const user = new User({
        facebookId:profile.id,
        Name:profile.displayName,
        provider:profile.provider
    });
    await user.save();
    return cb(null,profile);
   }else{
    console.log('Facebook User already exists');
    return cb(null,profile);
   }
  }
));




passport.serializeUser((user,done)=>{
    if(user){
        return done(null,user.id)
    }
    return done(null,false);
})


passport.deserializeUser((id,done)=>{
    const user = User.findById(id);
    if(user){
        return done(null,user);
    }
    return done(null,false);
})

app.get('/',(req,res)=>{
    res.render('Home')
})
app.get('/content',isAuthenticate,(req,res)=>{
    res.render('content');
})


function isAuthenticate(req,res,done){
    if(req.user){
        return done();
    }
    else{
        return res.redirect('/')
    }
}




app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/content');
  });

app.listen(port,()=>{
console.log(`listening on port ${port}`);
})