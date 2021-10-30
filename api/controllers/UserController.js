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
        var DBusername, DBuserpassword, DBcreditScore, DBconnectedGmail, DBdesc, DBnickname;
        db.collection('user', function (err, collection) {
            collection.find({ "username": username }).toArray(function (err, results) {
                console.log(results[0]);
                DBusername = results[0].username;
                DBuserpassword = results[0].password;

                // store items of the login account in the DB
                DBcreditScore = results[0].creditScore;
                DBdesc = results[0].profile.description;
                DBnickname = results[0].profile.nickname;
                DBconnectedGmail = results[0].connectedGamil; //typo here

                if (DBusername) {
                    sails.log("user: " + DBusername);
                    sails.log("user pw: " + DBuserpassword);
                    sails.log("input pw: " + password);

                    // password matched
                    if (DBuserpassword == password) {
                        sails.log("--> Matched!\n");

                       // assign session keys
                        req.session.memberid = DBusername;
                        req.session.connectedGmail = DBconnectedGmail;
                        req.session.creditScore = DBcreditScore;
                        req.session.nickname = DBnickname;
                        req.session.description = DBdesc;


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
                username: username, password: password, connectedGmail: req.session.useremail, connectedGmailID: req.session.userid, creditScore: 100, profile: {
                    description: '',
                    nickname: '',
                }
            }
        )

        db.collection('user').find().toArray(console.log);


        return res.ok();

    },

    logout:  function (req, res) {

        // clear session
        req.session.memberid = null;
        req.session.connectedGamil = null;
        req.session.creditScore = null;
        req.session.nickname = null;
        req.session.description = null;
        return res.redirect('/');

    },

    disconnectGmail: async function (req, res) {
        // clear req.session
        req.session.userid = null;
        req.session.username = null;
        req.session.useremail = null;

        return res.redirect("/signup");
    },


};

