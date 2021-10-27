'use strict';

var passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth20').Strategy;

//var verifyHandler = function(req, token, tokenSecret, profile, done) {
var verifyHandler = function (accessToken, refreshToken, profile, cb, done) {

    var data = {
        id: cb.id,
        name: cb.displayName,
        email: cb.emails[0].value,
        emailVerified: cb.emails[0].verified
    };

    return done(null, data);
};

passport.use(new GoogleStrategy({
    clientID: '61971271888-33he9ijq54d6pbd0ielg7du6emal56jr.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/api/v1/auth/google/callback',
    passReqToCallback: true
}, verifyHandler));