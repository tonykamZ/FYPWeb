/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {


    login: async function (req, res) {

        if (req.method == "GET") return res.view('loginForm', { status: '', username: username });

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
                if (results[0]) {
                    console.log(results[0]);
                    DBusername = results[0].username;
                    DBuserpassword = results[0].password;

                    // store items of the login account in the DB
                    DBcreditScore = results[0].creditScore;
                    DBdesc = results[0].profile.description;
                    DBnickname = results[0].profile.nickname;
                    DBconnectedGmail = results[0].connectedGmail; //typo here


                    sails.log("user: " + DBusername);
                    sails.log("user pw: " + DBuserpassword);
                    sails.log("input pw: " + password);

                    // password matched
                    if (DBuserpassword == password) {
                        sails.log("--> Matched!\n");

                        if (req.wantsJSON) {
                            sails.log("returning response json (result found!)");
                            return res.json(results[0]);
                        }
                        sails.log("setting session keys");
                        // assign session keys
                        req.session.memberid = DBusername;
                        req.session.connectedGmail = DBconnectedGmail;
                        req.session.creditScore = DBcreditScore;
                        req.session.nickname = DBnickname;
                        req.session.description = DBdesc;


                    } else {
                        if (req.wantsJSON) {
                            sails.log("returning response json (incorrectPassword)");
                            var IncorrectPasswordJSON = { status: 'incorrectPassword' }
                            return res.json(IncorrectPasswordJSON);
                        }
                        return res.view('loginForm', { status: 'incorrectPW', username: username });

                    }



                } else {
                    if (req.wantsJSON) {
                        sails.log("returning response json (UserNotExisit)");
                        var UserNotExisit = { status: 'UserNotExisit' }
                        return res.json(UserNotExisit);
                    }
                    return res.view('loginForm', { status: 'UserNotExisit', username: username });

                }

                // redirect to homepage
                return res.redirect("/");
            });
        });
    },

    signup: async function (req, res) {

        if (req.method == "GET") return res.view('signupForm', { status: '', ExisitingUser: '' });


        var username = req.body.username;
        var password = req.body.password;

        sails.log("Creating new account:");
        sails.log("username: " + username);
        sails.log("password: " + password);
        sails.log("connected to Gmail: " + req.session.useremail);
        sails.log("connected to Gmail ID: " + req.session.userid);

        // check if the connected Gmail exist in the DB
        // return error if yes.

        // check if the username is unqiue 
        // return error if no

        var db = sails.getDatastore().manager;

        // check if such username exist in the DB
        var newUser = await db.collection('user').findOne({ "username": username });
        if (newUser) {
            sails.log(newUser);

            if (req.wantsJSON) {
                sails.log('This request wants JSON!');
                return res.json(newUser);
            }


            return res.view('SignupForm', { status: '', ExisitingUser: newUser });
        }

        db.collection('user').insertOne(
            {
                username: username, password: password, connectedGmail: req.session.useremail, connectedGmailID: req.session.userid, creditScore: 100, profile: {
                    description: '',
                    nickname: '',
                }
            }
        )

        //var newUser = await db.collection('user').find({ "username": username }).toArray();

        var successJSON = { status: 'success' };
        if (req.wantsJSON) {
            sails.log('This request wants JSON!');
            return res.json(successJSON);
        }

        sails.log("created a new account!");
        return res.view('loginForm', { status: 'CreatedNewAC', username: username });

    },

    logout: function (req, res) {

        // clear session
        req.session.memberid = null;
        req.session.connectedGmail = null;
        req.session.creditScore = null;
        req.session.nickname = null;
        req.session.description = null;
        return res.redirect('/');

    },

    disconnectGmail: function (req, res) {
        // clear req.session
        req.session.userid = null;
        req.session.username = null;
        req.session.useremail = null;

        return res.redirect("/signup");
    },

    editProfile: async function (req, res) {

        if (req.method == "GET") return res.view('profile/profile');

        // get the input values
        var nickname = req.body.nickname;
        var description = req.body.description;

        sails.log("input values: " + nickname + ", " + description);

        // update DB
        var db = sails.getDatastore().manager;
        db.collection('user').updateOne(
            { username: req.session.memberid },
            // Update the nickname and desc
            {
                $set: {
                    profile: {
                        nickname: nickname, description: description
                    }
                }
            },
            {
                upsert: false
            }
        )

        // update session keys
        req.session.nickname = nickname;
        req.session.description = description.trim();

        return res.redirect("/profile");

    },


    post: async function (req, res) {

        if (req.method == "GET") return res.view('post/OpenPostForm');

        var title = req.body.title;
        var description = req.body.description.trim();
        var memberLimit = req.body.memberLimit;
        var attribution = req.body.attribution

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        if (day < 10) {
            day = "0" + day;
        }
        // it seems the date.getMonth() is wrong(?) Nov --> get 10 return
        month = month + 1;
        if (month < 10) {
            month = "0" + month;
        }
        if (h < 10) {
            h = "0" + h;
        }
        if (m < 10) {
            m = "0" + m;
        }
        if (s < 10) {
            s = "0" + s;
        }
        // DD/MM/YYYY HH:MM:SS
        var dateString = day + "/" + month + "/" + year + " " + h + ":" + m + ":" + s

        sails.log(title + ", " + description + ", " + memberLimit + ", " + attribution);
        sails.log("Date: " + date);
        sails.log("Date string: " + dateString);

        var db = sails.getDatastore().manager;
        var result = await db.collection('post').insertOne(
            {
                HostUsername: req.session.memberid, HostNickname: req.session.nickname, creditScore: req.session.creditScore, post: {
                    title: title, description: description, memberLimit: memberLimit, attribution: attribution
                }, createDate: dateString, updateDate: '', joinedMembers: [], comments: [{
                    content: '', byUsername: '', byUserNickname: '', byDate: ''
                }]
            }

        )

        return res.json(result);




    },

    home: async function (req, res) {

        var db = sails.getDatastore().manager;
        db.collection('post', function (err, collection) {
            collection.find().sort({ createDate: -1 }).toArray(function (err, results) {
                // get all posts from the DB
                return res.view('Home', { posts: results });
            })

        })



    },

    postDetail: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var result = await db.collection('post').findOne({ "_id": o_id });

        return res.view('post/postDetail', { post: result });



    },


    userDetail: async function (req, res) {
        
        var username = req.query.username;

        var db = sails.getDatastore().manager;
        // username is the unique key
        var result = await db.collection('user').findOne({ "username": username });
        if(result){
            return res.view('profile/profile', { user: result });
        }
        
    },


};

