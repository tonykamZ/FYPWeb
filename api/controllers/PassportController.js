/**
 * PassportController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var passport = require('passport');

module.exports = {

    googleAuth: function (req, res) {
        passport.authenticate('google', { scope: ['email', 'profile'] })(req, res);
    },

    googleCallback: function (req, res, next) {
        passport.authenticate('google', function (err, user) {
            if (err) {
                // redirect to login page
                console.log('google callback error: ' + err);
            } else {
                console.log('google credentials');
                console.log(user);
                req.session.userid = user.id;
                req.session.username = user.name;
                req.session.useremail = user.email;

                // go to DB check if it has connected account
                // ...

                // if yes, req.session.exisitngAC = ac.name


                return res.view('SignupForm', { status: 'verified', ExisitingUser: '',ExisitingGmail:'' });
            }
        })(req, res, next);
    },

};

