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

        // *** for system admin user only ***
        if (username.toLowerCase() == "admin") {
            if (password == "csfyp") {
                req.session.memberid = "admin";
                return res.redirect("/");
            } else {
                return res.view('loginForm', { status: 'incorrectPW', username: username });
            }
        }
        // *** for system admin user only ***                

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
                    DBconnectedGmail = results[0].connectedGmail;
                    DBnotification = results[0].notification;
                    DBUserStatus = results[0].status;


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
                        req.session.nickname = DBnickname;
                        req.session.description = DBdesc;
                        req.session.notification = DBnotification.length;
                        req.session.userStatus = DBUserStatus;
                        req.session.creditScore = DBcreditScore;
                        req.session.report = [];


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

        if (req.method == "GET") return res.view('SignupForm', { status: '', ExisitingUser: '', ExisitingGmail: '' });


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


            return res.view('SignupForm', { status: '', ExisitingUser: newUser, ExisitingGmail: '' });
        }

        // check if such username exist in the DB
        var duplicatedGmail = await db.collection('user').findOne({ "connectedGmail": req.session.useremail });
        /*if (duplicatedGmail) {
            sails.log('Duplicated Gmail in signing up: ' + duplicatedGmail);

            if (req.wantsJSON) {
                sails.log('This request wants JSON!');
                return res.json(newUser);
            }


            return res.view('SignupForm', { status: '', ExisitingUser: '', ExisitingGmail: duplicatedGmail });
        }*/

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
        sails.log("Created a new user at " + dateString);

        var db = sails.getDatastore().manager;
        db.collection('user').insertOne(
            {
                username: username, password: password, status: 'active', connectedGmail: req.session.useremail, connectedGmailID: req.session.userid, creditScore: 100, notification: [], profile: {
                    description: '',
                    nickname: '',
                }, createDate: new Date(), createDateString: dateString
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

    delUser: async function (req, res) {

        var username = req.params.id;

        var db = sails.getDatastore().manager;
        await db.collection('user').updateOne(
            { "username": username },
            {
                $set: {
                    status: 'banned'
                }
            }
        );

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

        var str = '***[SYSTEM MESSAGE] Your account has been banned at ' + year + "-" + month + "-" + day + " " + h + ":" + m + ":" + s +
            ' [SYSTEM MESSAGE]***';
        //send notification to user

        var r = await db.collection('user').findOne({ 'username': username });
        var user = {
            name: username,
            date: dateString,
            email: r.connectedGmail
        }
        Mailer.sendBanMail(user);

        await db.collection('user').updateOne(
            { "username": username },
            {
                $push: {
                    'notification': {
                        message: str, date: dateString
                    }
                }
            }
        );

        return res.ok();
    },

    actiUser: async function (req, res) {

        var username = req.params.id;

        var db = sails.getDatastore().manager;
        await db.collection('user').updateOne(
            { "username": username },
            {
                $set: {
                    status: 'active'
                }
            }
        );

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

        var str = '***[SYSTEM MESSAGE] Your account has been activated again at ' + year + "-" + month + "-" + day + " " + h + ":" + m + ":" + s +
            ' [SYSTEM MESSAGE]***';
        //send notification to user
        var r = await db.collection('user').findOne({ 'username': username });
        var user = {
            name: username,
            date: dateString,
            email: r.connectedGmail
        }
        Mailer.sendActiMail(user);

        await db.collection('user').updateOne(
            { "username": username },
            {
                $push: {
                    'notification': {
                        message: str, date: dateString
                    }
                }
            }
        );
        return res.ok();
    },

    checkUsername: async function (req, res) {

        // post function
        var username = req.params.id;

        var db = sails.getDatastore().manager;
        // check if such username exist in the DB
        var User = await db.collection('user').findOne({ "username": username });

        sails.log("Input username: " + username);
        if (User) {
            // duplicated username
            res.statusMessage = "duplicated";
            res.status(200).end();
        } else {
            res.statusMessage = "free";
            res.status(200).end();
        }
    },

    logout: function (req, res) {

        // clear session
        req.session.memberid = null;
        req.session.connectedGmail = null;
        req.session.nickname = null;
        req.session.description = null;
        req.session.notification = null;
        req.session.report = null;
        return res.redirect('/');

    },

    report: async function (req, res) {
        var content = req.body.content;
        var otherContent = req.body.otherContent;
        var evidence = req.body.evidence;
        var photoLink = req.body.photoLink;
        var reportUser = req.body.reportUser;

        if (content == "other") content = otherContent;
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
        sails.log("reported a user (" + reportUser + ") at " + dateString);

        var num = Math.floor(Math.random() * 90000) + 10000;

        var db = sails.getDatastore().manager;
        await db.collection('report').insertOne(
            {
                reportID: num, reportUser: reportUser, content: content, evidence: evidence, photoLink: photoLink, reportedBy: req.session.memberid, status: 'Pending', actionTaken: {},
                createDate: new Date(), createDateString: dateString, updateDate: new Date(), updateDateString: ''
            }
        )
        // store report user in session key. if user want to report the same person again, take some action.
        req.session.report.push(reportUser);
        return res.view('report/successReport', { reportUser: reportUser, reportID: num })
    },

    reportHandle: function (req, res) {

        var status = req.query.status || ""; // 'pending', 'approved', 'rejected', 'further investigation'
        var category = req.query.category || ""; // 'misinfo', 'hate speech', 'others'...

        var db = sails.getDatastore().manager;
        db.collection('report', function (err, collection) {
            collection.find(
                {
                    $and: [{
                        'status': { $regex: status || "", $options: "$i" }
                    },
                    { 'content': { $regex: category || "", $options: "$i" } }
                    ]


                },

            ).sort([['_id', -1]]).toArray(function (err, results) {
                // get all posts from the DB
                if (req.wantsJSON) {
                    sails.log("returning reporthandling page json data");
                    return res.json(results);
                }
                return res.view('reportHandle', { reports: results, reportCnt: results.length });
            })

        })

    },

    viewReport: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var result = await db.collection('report').findOne({ "_id": o_id });
        var reportUser = await db.collection('user').findOne({ "username": result.reportUser });
        var reportedBy = await db.collection('user').findOne({ "username": result.reportedBy });

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result, reportUser, reportedBy));
            return res.json(result);
        }

        return res.view('report/detail', { report: result, reportedBy: reportedBy, reportUser: reportUser });
    },

    viewReportOnly: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var result = await db.collection('report').findOne({ "_id": o_id });

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result, reportUser, reportedBy));
            return res.json(result);
        }

        return res.view('report/viewOnly', { report: result });
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

        return res.redirect("/read/profile?username=" + req.session.memberid);

    },


    post: async function (req, res) {

        if (req.method == "GET") return res.view('post/OpenPostForm');

        // prevent non-active user create post
        if (req.session.userStatus != "active") { return res.redirect('/explore'); }

        var title = req.body.title;
        var description = req.body.description.trim();
        var memberLimit = req.body.memberLimit;
        var attribution = req.body.attribution;
        var attribution2 = req.body.attribution2;
        var attribution3 = req.body.attribution3;
        var attribution4 = req.body.attribution4;
        var attribution5 = req.body.attribution5;
        var img = req.body.imgInput;
        var method = req.body.method;
        var cat = req.body.cat;
        var dType = req.body.dType;

        if (dType == "Other") {
            dType = "Other:" + req.body.otherVal;
        }

        var attr = [attribution] // define new array for storing links
        // check if there exist additional attribution links
        if (attribution2) {
            attr.push(attribution2);
            if (attribution3) {
                attr.push(attribution3);
                if (attribution4) {
                    attr.push(attribution4);
                    if (attribution5) {
                        attr.push(attribution5);
                    }
                }
            }
        }
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

        memberLimit = parseInt(memberLimit);

        var num = Math.floor(Math.random() * 9000000) + 100000;
        var db = sails.getDatastore().manager;
        var result = await db.collection('post').insertOne(
            {
                postID: num, HostUsername: req.session.memberid, HostNickname: req.session.nickname, post: {
                    title: title, cat: cat, description: description, memberLimit: memberLimit, attribution: attr, imgInput: img, method: method, dType: dType
                }, createDate: new Date(), createDateString: dateString, updateDate: new Date(), updateDateString: '', joinedMembers: [], joinedHistory: [], comments: [], status: 'available'
            }

        )

        // insert a copy in postHistory (for permanently storage)
        var historyResult = await db.collection('postHistory').insertOne(
            {
                postID: num, HostUsername: req.session.memberid, HostNickname: req.session.nickname, post: {
                    title: title, cat: cat, description: description, memberLimit: memberLimit, attribution: attr, imgInput: img, method: method, dType: dType
                }, createDate: new Date(), createDateString: dateString, updateDate: new Date(), updateDateString: '', joinedMembers: [], joinedHistory: [], comments: [], status: "Active"
            }

        )


        return res.redirect('/explore');
        //return res.json(result);




    },

    notiList: async function (req, res) {
        var db = sails.getDatastore().manager;
        var result = await db.collection('user').findOne({ "username": req.session.memberid });

        if (!result) {
            result = 1; // call back value
        }
        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result));
            return res.json(result);
        }
        return res.view('profile/notiList', { notiList: result.notification });
    },

    delNoti: async function (req, res) {

        var id = req.query.id;


        sails.log("ready to delete notification (" + id + ")");
        var db = await sails.getDatastore().manager;

        // delete all notification option
        if (id == "ALL") {
            await db.collection('user').updateOne(
                { "username": req.session.memberid },
                {
                    $set: {
                        notification: []
                    }
                }
            )
            req.session.notification = 0;
            sails.log("deleted ALL notification");
            return res.ok();
        }


        await db.collection('user').updateOne(
            { "username": req.session.memberid },
            {
                $pull: {
                    notification: {
                        date: id
                    }
                }
            }
        )

        req.session.notification = req.session.notification - 1;

        sails.log("deleted notification (" + id + ")");

        return res.ok();

    },

    memberDelPost: async function (req, res) {

        // prevent non-active user create post
        if (req.session.userStatus != "active") { return res.redirect('/explore'); }

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var post = await db.collection('post').findOne({ '_id': o_id });
        await db.collection('post').remove({ '_id': o_id });

        // update post history
        await db.collection('postHistory').updateOne(
            { "postID": post.postID },
            {
                $set: {
                    'status': "Deleted"
                }
            }
        );

        return res.ok();
    },

    delPost: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var delReason = req.body.delReason;
        var username = req.body.username;
        var csd = req.body.csd;


        var db = sails.getDatastore().manager;
        var post = await db.collection('post').findOne({ '_id': o_id });

        var user = await db.collection('user').findOne({ 'username': username });
        if (!user) {
            // if user doesn't exist, delete anyway
            await db.collection('post').remove({ '_id': o_id });
            return res.redirect('/explore');
        }
        var score = parseInt(user.creditScore) - csd;

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

        await db.collection('post').remove({ '_id': o_id });
        delReason = "***[SYSTEM MESSAGE] Your post (title: " + post.post.title + ") " +
            "has been removed. " + csd + " credit score deducted [SYSTEM MESSAGE]*** " + delReason;
        await db.collection('user').updateOne(
            { "username": username },
            {
                $push: {
                    'notification': {
                        message: delReason, date: dateString
                    }
                },
                $set: {
                    'creditScore': parseInt(score)
                }
            }
        );

        // update post history
        await db.collection('postHistory').updateOne(
            { "postID": post.postID },
            {
                $set: {
                    'status': "Removed"
                }
            }
        );

        return res.redirect('/explore');

    },

    home: async function (req, res) {

        var keywords = req.query.keywords;
        var cat = req.query.cat;
        var dType = req.query.dType;
        var chkFull = req.query.chkFull;


        sails.log(keywords + " " + cat + " " + dType + " " + chkFull);
        var search = keywords || cat || dType || chkFull;

        if (chkFull) {
            chkFull = "available";
        }
        var db = sails.getDatastore().manager;
        db.collection('post', function (err, collection) {
            collection.find(
                {
                    $and: [
                        {
                            $or: [
                                { "post.title": { $regex: keywords || "", $options: "$i" } },
                                { "post.description": { $regex: keywords || "", $options: "$i" } },
                            ]
                        },
                        {
                            "post.cat": { $regex: cat || "", $options: "$i" }
                        },
                        {
                            "post.dType": { $regex: dType || "", $options: "$i" }
                        },
                        {
                            "status": { $regex: chkFull || "", $options: "$i" }
                        }
                    ]
                },

            ).sort([['_id', -1]]).toArray(function (err, results) {
                // get all posts from the DB
                if (req.wantsJSON) {
                    sails.log("returning Home page json data");
                    return res.json(results);
                }
                return res.view('Home', { posts: results, postCnt: results.length, search: search });
            })

        })



    },

    landing: async function (req, res) {

        var db = sails.getDatastore().manager;
        var post = await db.collection('post').find().toArray();
        var user = await db.collection('user').find().toArray();

        // count category
        var fnd = elect = colth = ness = course = service = game = any = 0;
        post.forEach(function (p) {
            if (p.post.cat == "Food&Drink") {
                fnd += 1
            } else if (p.post.cat == "Electronic") {
                elect += 1;
            } else if (p.post.cat == "Colthing") {
                colth += 1;
            } else if (p.post.cat == "Necessity") {
                ness += 1;
            } else if (p.post.cat == "Course") {
                course += 1;
            } else if (p.post.cat == "Service") {
                service += 1;
            } else if (p.post.cat == "Game") {
                game += 1;
            } else {
                any += 1;
            }
            sails.log("CAT = " + p.post.cat);
        });
        return res.view('landingPage', { post: post, user: user.length, fnd: fnd, elect: elect, colth: colth, ness: ness, course: course, service: service, game: game, any: any });

    },

    postHistoryDetail: async function (req, res) {

        var postID = req.params.id;

        postID = parseInt(postID);
        sails.log('finding post history with id: ' + postID);
        var db = sails.getDatastore().manager;
        var post = await db.collection('postHistory').findOne({ "postID": { $eq: postID } });

        var access = 'forbidden';
        if (req.session.memberid == "admin") {
            access = 'accessible';
        }

        return res.view('post/history/detail', { post: post, access: access });


    },

    postDetail: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var result = await db.collection('post').findOne({ "_id": o_id });

        var host = await db.collection('user').findOne({ "username": result.HostUsername });

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result));
            return res.json(result);
        }
        return res.view('post/postDetail', { post: result, creditScore: host.creditScore });

    },

    postDetailByID: async function (req, res) {

        var id = req.query.postID;
        id = parseInt(id);

        var db = sails.getDatastore().manager;
        var post = await db.collection('post').findOne({ "postID": { $eq: id } });

        if (!post) return res.view('post/notFound', { id: id });

        var user = await db.collection('user').findOne({ 'username': post.HostUsername });
        var creditScore = user.creditScore;

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(post));
            return res.json(post);
        }
        return res.view('post/postDetail', { post: post, creditScore: creditScore });

    },

    manage: async function (req, res) {

        var db = sails.getDatastore().manager;
        db.collection('post', function (err, collection) {
            collection.find({ 'HostUsername': req.session.memberid }).sort({ createDate: -1 }).toArray(function (err, results) {
                // get all posts of session user from the DB
                if (req.wantsJSON) {
                    sails.log("returning manage page json data");
                    sails.log("stringgify result: " + JSON.stringify(result));
                    return res.json(results);
                }
                return res.view('post/manage', { posts: results });
            })

        })

    },

    editPostForm: async function (req, res) {
        if (req.method == "GET") {
            var id = req.params.id;
            var ObjectId = require('mongodb').ObjectId;
            var o_id = new ObjectId(id);

            var db = sails.getDatastore().manager;
            var result = await db.collection('post').findOne({ "_id": o_id });

            if (req.wantsJSON) {
                sails.log("returning detail page json data");
                sails.log("stringgify result: " + JSON.stringify(result));
                return res.json(result);
            }
            return res.view('post/editPostForm', { post: result });
        } else {

            // prevent non-active user create post
            if (req.session.userStatus != "active") { return res.redirect('/explore'); }

            var id = req.params.id;
            var ObjectId = require('mongodb').ObjectId;
            var o_id = new ObjectId(id);

            var title = req.body.title;
            var description = req.body.description.trim();
            // var memberLimit = req.body.memberLimit; // member limit is not allowed to change
            var attribution = req.body.attribution;
            var attribution2 = req.body.attribution2;
            var attribution3 = req.body.attribution3;
            var attribution4 = req.body.attribution4;
            var attribution5 = req.body.attribution5;
            var img = req.body.imgInput;
            var method = req.body.method;
            var cat = req.body.cat;
            var dType = req.body.dType;

            sails.log("method = " + method + " cat = " + cat + " dtype = " + dType);
            if (dType == "Other") {
                dType = "Other:" + req.body.otherVal;
            }

            var attr = [attribution] // define new array for storing links
            // check if there exist additional attribution links
            if (attribution2) {
                attr.push(attribution2);
                if (attribution3) {
                    attr.push(attribution3);
                    if (attribution4) {
                        attr.push(attribution4);
                        if (attribution5) {
                            attr.push(attribution5);
                        }
                    }
                }
            }
            var date = new Date();
            var day = date.getDate();
            var month = date.getMonth();
            var year = date.getFullYear();
            var h = date.getUTCHours() + 8;
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
            // YYYY-MM-DDTHH:MM:SS
            var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

            // memberLimit = parseInt(memberLimit);
            sails.log("editing the post (" + id + ")");
            sails.log("updated time: " + dateString);

            var db = sails.getDatastore().manager;
            var post = await db.collection('post').findOne({ '_id': o_id });
            var result = await db.collection('post').updateOne(
                { "_id": o_id },
                {
                    $set: {
                        'post.title': title,
                        'post.description': description,
                        'post.attribution': attr,
                        'post.imgInput': img,
                        'post.cat': cat,
                        'post.method': method,
                        'post.dType': dType,
                        updateDate: new Date(),
                        updateDateString: dateString
                    }
                }
            )

            await db.collection('postHistory').updateOne(
                { "postID": post.postID },
                {
                    $set: {
                        'post.title': title,
                        'post.description': description,
                        'post.attribution': attr,
                        'post.imgInput': img,
                        'post.cat': cat,
                        'post.method': method,
                        'post.dType': dType,
                        updateDate: new Date(),
                        updateDateString: dateString
                    }
                }
            );

            res.redirect("/read/post/" + id);
        }
    },


    userDetail: async function (req, res) {

        var username = req.query.username;

        if (username.toLowerCase() == "admin") {
            return res.view('profile/profile', { user: { username: "admin" } });

        }
        var db = sails.getDatastore().manager;
        // find all post that the user joined
        var userJoinedPosts = await db.collection('post').find({ "joinedMembers": username }).toArray();

        // find the user

        await db.collection('user').find({ "username": username }).toArray(function (err, userDetail) {


            if (req.wantsJSON) {
                sails.log("returning user profile page json data");
                sails.log("stringgify result: " + JSON.stringify(userDetail));
                return res.json({
                    userDetail: userDetail,
                    joinedPosts: userJoinedPosts
                });
            }
            return res.view('profile/profile', { user: userDetail[0], joinedPosts: userJoinedPosts });
        });

    },

    viewPostHistory: async function (req, res) {

        var username = req.query.username;

        if (username.toLowerCase() == "admin") {
            return res.view('post/postHistory', { user: { username: username }, posts: null });
        }
        var db = sails.getDatastore().manager;
        // find all post that the user hosted/hosting
        var userHostPosts = await db.collection('postHistory').find({ "HostUsername": username }).sort([['_id', -1]]).toArray();

        var user = await db.collection('user').findOne({ "username": username });
        if (!user) {
            return res.view('404');
        }

        if (req.wantsJSON) {
            sails.log("returning user post history page json data");
            sails.log("stringgify result: " + JSON.stringify(userHostPosts));
            return res.json({
                userHostPosts: userHostPosts
            });
        }

        return res.view('post/postHistory', { user: { username: username }, posts: userHostPosts });

    },

    viewALLPostHistory: async function (req, res) {

        if (req.session.memberid != "admin") {
            return res.view('404');
        }
        var db = sails.getDatastore().manager;
        // find all post in the history
        var posts = await db.collection('postHistory').find({}).sort([['_id', -1]]).toArray();

        return res.view('post/history/database', { posts: posts });

    },

    joinPost: async function (req, res) {

        if (req.method == 'GET') {
            return res.redirect('/read/post/' + req.params.id);
        } else {
            var id = req.params.id;
            var ObjectId = require('mongodb').ObjectId;
            var o_id = new ObjectId(id);

            var db = sails.getDatastore().manager;
            var result = await db.collection('post').findOne({ "_id": o_id });

            if (result) {

                // host user is not included in "joinedMembers"
                var memberCnt = result.joinedMembers.length;
                var memberLimit = result.post.memberLimit;
                sails.log("Exisiting members count: " + memberCnt);
                if (memberCnt + 1 >= memberLimit) {
                    // exceed limit
                    res.statusMessage = "Fail to join! The quota is full!";
                    res.status(400).end();
                    return;
                }

                // loop the exisiting members, check if current user is duplicated in DB?
                for (var i = 0; i < memberCnt; i++) {
                    sails.log("[" + i + "] : " + result.joinedMembers[i]);
                    if (result.joinedMembers[i] == req.session.memberid) {
                        // duplicated
                        sails.log("user duplicated in the DB!");
                        res.statusMessage = "You've joined this post before!";
                        res.status(400).end();
                        return;
                    }
                }

                var date = new Date();
                var day = date.getDate();
                var month = date.getMonth();
                var year = date.getFullYear();
                var h = date.getUTCHours() + 8;
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

                var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
                var timing = dateString + " - " + req.session.memberid + " has joined";
                sails.log("timing = " + timing);
                //update user count: push current session user to that post
                //push the successful joined record to DB
                await db.collection('post').updateOne(
                    { "_id": o_id },
                    { $push: { joinedMembers: req.session.memberid, joinedHistory: timing } }
                )

                // update post history
                await db.collection('postHistory').updateOne(
                    { "postID": result.postID },
                    {
                        $push: { joinedMembers: req.session.memberid, joinedHistory: timing }
                    }
                );

                // trigger the deal (member limit is full after joined)
                // +2 : +1 (Host) +1 (current joined member)
                if (memberCnt + 2 >= memberLimit) {
                    // update post status to "FULL"
                    await db.collection('post').updateOne(
                        { "_id": o_id },
                        { $set: { status: 'full' } }
                    )

                    var noti = "***[SYSTEM MESSAGE] The post you joined is full now. " +
                        "Please check out the post! (post title: " + result.post.title + " | Host:" + result.HostUsername + ") [SYSTEM MESSAGE]***";

                    // send message to all joined members
                    result.joinedMembers.forEach(async function (p) {
                        // send email to all joined member
                        var member = await db.collection('user').findOne({ 'username': p });
                        var user = {
                            name: member.username,
                            email: member.connectedGmail,
                            title: result.post.title,
                            host: result.HostUsername,
                            date: dateString,
                        }
                        Mailer.sendDealMailtoMember(user);

                        await db.collection('user').updateOne(
                            { "username": p },
                            {
                                $push: {
                                    'notification': {
                                        message: noti, date: dateString
                                    }
                                }
                            }
                        );
                    });

                    var notiTohost = "***[SYSTEM MESSAGE] The post you host is full now. " +
                        "Please check out the post! (post title: " + result.post.title + " | post id: " + result.postID + ") [SYSTEM MESSAGE]***";
                    // send message to the host
                    // send email to all joined member
                    var hostUser = await db.collection('user').findOne({ 'username': result.HostUsername });
                    var ho = {
                        name: hostUser.username,
                        email: hostUser.connectedGmail,
                        title: result.post.title,
                        id: result.postID,
                        date: dateString,
                    }
                    Mailer.sendDealMailtoHost(ho);

                    await db.collection('user').updateOne(
                        { "username": result.HostUsername },
                        {
                            $push: {
                                'notification': {
                                    message: notiTohost, date: dateString
                                }
                            }
                        }
                    );
                }


            } else {
                //return null
                sails.log("null data!");
                res.statusMessage = "No data found!";
                res.status(400).end();
                return;
            }

            //if (req.wantsJSON) {
            //    sails.log("returning detail page json data");
            //    sails.log("stringgify result: " + JSON.stringify(result));
            //    return res.json(result);
            //}

            sails.log(req.session.memberid + " request joining this post (" + id + ") ...")
            return res.ok();

        }
    },


    leavePost: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
        var timing = dateString + " - " + req.session.memberid + " has left";
        sails.log("timing = " + timing);
        // remove session user in the post
        await db.collection('post').updateOne(
            { "_id": o_id },
            { $pull: { joinedMembers: req.session.memberid } }
        )

        // add record to DB
        await db.collection('post').updateOne(
            { "_id": o_id },
            { $push: { joinedHistory: timing } }
        )

        var result = await db.collection('post').findOne({ "_id": o_id });

        // update post history
        await db.collection('postHistory').updateOne(
            { "postID": result.postID },
            { $pull: { joinedMembers: req.session.memberid } }
        );
        // update post history
        await db.collection('postHistory').updateOne(
            { "postID": result.postID },
            { $push: { joinedHistory: timing } }
        );

        // if (req.wantsJSON){}

        return res.ok();

    },

    comment: async function (req, res) {

        var id = req.params.id; // post id
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);
        var cm = req.query.cm.trim(); // comment content
        var username = req.session.memberid;
        var UserNickname = req.session.nickname;

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

        var db = sails.getDatastore().manager;
        await db.collection('post').updateOne(
            { "_id": o_id },
            {
                $push: {
                    comments: {
                        content: cm, byUsername: username, byUserNickname: UserNickname, byDateString: dateString, byDate: new Date()
                    }
                }
            }
        )

        var post = await db.collection('post').findOne({ "_id": o_id });
        // update post history
        await db.collection('postHistory').updateOne(
            { "postID": post.postID },
            {
                $push: {
                    comments: {
                        content: cm, byUsername: username, byUserNickname: UserNickname, byDateString: dateString, byDate: new Date()
                    }
                }
            }
        );


        return res.ok();

    },



    showUsers: async function (req, res) {
        var db = sails.getDatastore().manager;
        db.collection('user', function (err, collection) {
            collection.find().sort([['_id', -1]]).toArray(function (err, results) {
                // get all posts from the DB
                if (req.wantsJSON) {
                    sails.log("returning user json data");
                    return res.json(results);
                }
                return res.view('userlist', { users: results });
            })

        })
    },

    deleteReport: async function (req, res) {
        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = await sails.getDatastore().manager;
        await db.collection('report').remove({ '_id': o_id });

        sails.log("deleted report (" + id + ")");

        return res.redirect("/reporthandle");
    },

    reportHistory: async function (req, res) {

        var db = await sails.getDatastore().manager;
        var reports = await db.collection('report').find({ 'reportedBy': req.session.memberid }).toArray();


        return res.view('report/reportHistory', { reports: reports });
    },

    updateReportStatus: async function (req, res) {

        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var status = req.body.status;
        var reportID = req.body.reportID;
        var reportUser = req.body.reportUser;
        var reportUserCS = req.body.reportUserCS;
        var reportedBy = req.body.reportedBy;
        var reportedByCS = req.body.reportedByCS;
        var reportUserCSD = req.body.reportUserCSD;
        var reportedByCSD = req.body.reportedByCSD;
        var message = req.body.message;

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;


        var db = await sails.getDatastore().manager;
        await db.collection('report').updateOne(
            { "_id": o_id },
            {
                $set: {
                    'status': status, 'actionTaken': {
                        reportUserCSD: reportUserCSD,
                        reportedByCSD: reportedByCSD,
                        message: message,
                        date: dateString
                    }
                }
            }
        );

        // send notification
        var notificationToReportUser = "";
        var notificationToReportedBy = "";
        if (status == "Approved") {
            var score = parseInt(reportUserCS) - parseInt(reportUserCSD);
            notificationToReportUser += "***[SYSTEM MESSAGE]You are reported by other user. " +
                "The penalty is " + reportUserCSD + " marks deduction of your credit score. " +
                "Original score: " + reportUserCS + " Score after deduction: " + score +
                "[SYSTEM MESSAGE]*** " +
                "Message from the admin: ";
            notificationToReportUser += message;

            await db.collection('user').updateOne(
                { "username": reportUser },
                {
                    $push: {
                        'notification': {
                            message: notificationToReportUser, date: dateString
                        }
                    },
                    $set: {
                        'creditScore': parseInt(score)
                    }
                }
            );

            // send to reported by user
            notificationToReportedBy += "***[SYSTEM MESSAGE]Your report (#" + reportID + ") is approved. " +
                "The penalty for user@" + reportUser + " is " + reportUserCSD + " marks deduction of the credit score. " +
                "[SYSTEM MESSAGE]***" +
                "Message from the admin: ";
            notificationToReportedBy += message;

            await db.collection('user').updateOne(
                { "username": reportedBy },
                {
                    $push: {
                        'notification': {
                            message: notificationToReportedBy, date: dateString
                        }
                    }
                }
            );


        } else if (status == "Rejected") {
            notificationToReportedBy += "***[SYSTEM MESSAGE]Your report (#" + reportID + ") is rejected. ";

            var score = parseInt(reportedByCS);
            if (reportedByCSD) {
                if (reportedByCSD > 0) {
                    score = score - parseInt(reportedByCSD);
                    notificationToReportedBy += "The penalty is " + reportedByCSD + " marks deduction of your credit score. " +
                        "Original score: " + reportedByCS + " Score after deduction: " + score;
                }
            }

            notificationToReportedBy += "[SYSTEM MESSAGE]*** " +
                "Message from the admin: ";
            notificationToReportedBy += message;

            await db.collection('user').updateOne(
                { "username": reportedBy },
                {
                    $push: {
                        'notification': {
                            message: notificationToReportedBy, date: dateString
                        }
                    },
                    $set: {
                        'creditScore': parseInt(score)
                    }
                }
            );
        } else {
            notificationToReportedBy += "***[SYSTEM MESSAGE]Your report (#" + reportID + ") need further investigation. " +
                "[SYSTEM MESSAGE]***" +
                "Message from the admin: ";
            notificationToReportedBy += message;

            await db.collection('user').updateOne(
                { "username": reportedBy },
                {
                    $push: {
                        'notification': {
                            message: notificationToReportedBy, date: dateString
                        }
                    }
                }
            );
        }


        sails.log("updated report (" + id + ") status to be " + status);
        sails.log("Report User @" + reportUser + " has been deducted " + reportUserCSD + " (Original:" + reportUserCS + ")");
        sails.log("Reported by @" + reportedBy + " has been deducted " + reportedByCSD + " (Original:" + reportedByCS + ")");
        sails.log("Message: " + message);

        return res.redirect("/read/report/" + id);
    },



    // directly send notification to user
    sendNotificationOnly: async function (req, res) {

        var username = req.query.username;
        var message = req.query.message;

        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var h = date.getUTCHours() + 8;
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
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;


        var db = await sails.getDatastore().manager;
        var str = "*** ***" + message;
        await db.collection('user').updateOne(
            { "username": username },
            {
                $push: {
                    'notification': {
                        message: str, date: dateString
                    }
                }
            }
        );

        return res.ok();
    },

    emailWelcome: function (req, res) {

        var user = { name: 'tony', email: '18226485@life.hkbu.edu.hk' }
        Mailer.sendDealMailtoMember(user);

        return res.ok();


    },




    test: async function (req, res) {

        return res.view('test');

    },


    terms: function (req, res) {


        return res.view('terms');

    },

    policy: function (req, res) {


        return res.view('policy');

    },

    loader: function (req, res) {

        return res.sendfile('loaderio-2feda3059cf8e1e5f77aaec7b7133a00.txt');
    }


};

