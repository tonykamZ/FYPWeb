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
        var db = await sails.getDatastore().manager;

        // go to user DB, fine all user with username = input username
        var DBusername;
        var DBuserpassword;
        db.collection('user', function (err, collection) {
            collection.find({ "username": username }).toArray(function (err, results) {
                console.log(results[0]);
                DBusername = results[0].username;
                DBuserpassword = results[0].password;



                if (DBusername) {
                    sails.log("user found: " + DBusername);
                    sails.log("\nuser pw: " + DBuserpassword);
                    sails.log("input pw: " + password);

                    // password matched
                    if (DBuserpassword == password) {
                        sails.log("\nMatched!\n");

                        // set session
                        // assign the username to the session.memberid key
                        req.session.memberid = DBusername;

                    } else {
                        sails.log("Incorrect Password!");

                    }
                } else {
                    sails.log("User not Exisit!");
                }

                // redirect to homepage
                return res.redirect("/");
            });
        });
    },

    signup: async function (req, res) {

        if (req.method == "GET") return res.view('signupForm', { status: '' });

        var username = req.body.username;
        var password = req.body.password;

        sails.log("Creating new account:");
        sails.log("username: " + username);
        sails.log("password: " + password);
        sails.log("\nconnected to Gmail: " + req.session.useremail + "\n");
        sails.log("\nconnected to Gmail ID: " + req.session.userid + "\n");

        // check if the connected Gmail exist in the DB
        // return error if yes.

        // check if the username is unqiue 
        // return error if no

        var db = sails.getDatastore().manager;
        db.collection('user').insertOne(
            {
                username: username, password: password, connectedGamil: req.session.useremail, connectedGamilID: req.session.userid, creditScore: 100, profile: {
                    description: '',
                    nickname: '',
                }
            }
        )

        db.collection('user').find().toArray(console.log);


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

