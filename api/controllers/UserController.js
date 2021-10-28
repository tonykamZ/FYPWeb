/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {


    login: async function (req, res) {

        if (req.method == "GET") return res.view('loginForm');

        var username = req.body.username;
        var password = req.body.password;

        sails.log("username = " + username + " password = " + password);

        // call api

        // Get access to the native MongoDB client via the default Sails datastore.
        var db = sails.getDatastore().manager;

        // Find all users who own albums with the word "blue" in the title.
        // ("albums" would be defined in `api/models/User.js` as an attribute of type "json".)
        db.collection('test').find({ "user": username }).toArray(console.log);

        // response and return

        return res.ok();
    },

    signup: async function (req, res) {

        if (req.method == "GET") return res.view('signupForm', { status: '' });

        var username = req.body.username;
        var password = req.body.password;

        return res.ok();

    },

    disconnectGmail: async function (req, res) {
        // clear req.session
        req.session.userid = null;
        req.session.username = null;
        req.session.useremail = null;

        return res.redirect("/signup");
    },


};

