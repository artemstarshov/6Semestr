const express = require('express');
const app = express();
const port = 8081;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const VKontakteStrategy = require('passport-vkontakte').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin', 'email':'Aks-fam@yandex.ru'},
            {'login': 'local_js_god', 'email':'ilia-gossoudarev@yandex.ru'}];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user.login);
  });
  //user - объект, который Passport создает в req.user
passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
        done(null, user);
});

passport.use(new YandexStrategy({
    clientID: 'f2b6ae03e3d4468cb9dd25c6f97f6e9e',
    clientSecret: '76e2b149a3fb47f4b4d841bddeb0759a',
    callbackURL: "http://localhost:8081/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = profile;
    if (user) return done(null, user);

    done(true, null);
  }
));

passport.use(new VKontakteStrategy(
        {
            clientID: '51682239', // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
            clientSecret: 'SPv9hNvzJlmq5qrOdo8b',
            callbackURL: "http://localhost:8081/auth/vkontakte/callback",
        },
        function myVerifyCallbackFn(
            accessToken,
            refreshToken,
            params,
            profile,
            done
        ) {
            // Now that we have user's `profile` as seen by VK, we can
            // use it to find corresponding database records on our side.
            // Also we have user's `params` that contains email address (if set in
            // scope), token lifetime, etc.
            // Here, we have a hypothetical `User` class which does what it says.
            User.findOrCreate({ vkontakteId: profile.id })
                .then(function (user) {
                    done(null, user);
                })
                .catch(done);
        }
    )
);


const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}


app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});
app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', passport.authenticate('yandex', { failureRedirect: '/sorry', successRedirect: '/private' }));

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.get("/auth/vkontakte", passport.authenticate("vkontakte"));

app.get('/auth/vkontakte/callback', passport.authenticate('vkontakte', { failureRedirect: '/sorry', successRedirect: '/private' }));



app.listen(port, () => console.log(`App listening on port ${port}!`))