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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
        sails.log("Created a new user at " + dateString);

        var db = sails.getDatastore().manager;
        db.collection('user').insertOne(
            {
                username: username, password: password, connectedGmail: req.session.useremail, connectedGmailID: req.session.userid, creditScore: 100, profile: {
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

    logout: function (req, res) {

        // clear session
        req.session.memberid = null;
        req.session.connectedGmail = null;
        req.session.creditScore = null;
        req.session.nickname = null;
        req.session.description = null;
        return res.redirect('/');

    },

    report: function (req, res) {

        var username = req.query.username;
        if (username && req.session.memberid) {
            res.writeHead(200, { 'content-type': 'text/html' });
            res.end(
                '<form method="POST" action="/report" enctype="multipart/form-data">' +

                '   <label><b>You are reporting user @</b><b style="color: blue;">' +
                username +
                ' </b></label>' +
                '<input type="string" name="reportUser" value="' + username + '" hidden>' +

                '<div class="form-row">' +
                '<label>Report reason:</label>' +
                '<div class="form-group col-md-5">' +
                '<input type="text" class="form-control" name="content"' +
                'placeholder="Report reason" required />' +
                '</div>' +
                '</div><br>' +

                '<div class="form-row">' +
                '<label><b>Detail evidence: </b></label>' +
                '<textarea rows="5" name="evidence" class="form-control"' +
                'placeholder="Provide more info to us" required></textarea>' +
                '</div><br>' +

                '<div class="form-row">' +
                '<label><b>Photo proof: </b></label>' +
                '<input type="file" accept=".jpg" name="filename"  multiple="multiple"' +
                'class="form-control" required>' +
                '</div><br>' +

                '<small id="info">*Double check the information that you provided.' +
                'This may help us identify malicious activities.</small><br>' +
                ' <button id="submit" class="btn btn-outline-success"' +
                '    type="submit">Submit</button>' +
                '</form>'
            )
        } else {
            return res.redirect('/');
        }
    },
    reportUpload: async function (req, res) {
        req.file('filename').upload({
            dirname: require('path').resolve(sails.config.appPath, 'assets/images'),
        }, async function (err, files) {
            if (err)
                return res.serverError(err);

            var content = req.body.content;
            var evidence = req.body.evidence;
            var reportUser = req.body.reportUser;

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
            // YYYY-MM-DDTHH:MM:SS
            var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
            sails.log("reported a user (" + reportUser + ") at " + dateString);

            var photoPathArray = [];
            for (var i = 0; i < files.length; i++) {
                photoPathArray.push(files[i].fd);
            }
            sails.log("photoPathArray: " + photoPathArray);

            var db = sails.getDatastore().manager;
            await db.collection('report').insertOne(
                {
                    reportUser: reportUser, content: content, evidence: evidence, reportedBy: req.session.memberid, status: 'pending',
                    photoPath: photoPathArray, createDate: new Date(), createDateString: dateString, updateDate: new Date(), updateDateString: ''
                }
            )
            return res.json({
                message: files.length + ' file(s) uploaded successfully!',
                files: files
            });
        });
    },


    /*report: async function (req, res) {
        var content = req.body.content;
        var otherContent = req.body.otherContent;
        var evidence = req.body.evidence || "";
        var reportUser = req.body.reportUser;

        if (content == "other") content = otherContent;
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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;
        sails.log("reported a user (" + reportUser + ") at " + dateString);

        var db = sails.getDatastore().manager;
        await db.collection('report').insertOne(
            {
                reportUser: reportUser, content: content, evidence: evidence, reportedBy: req.session.memberid, status: 'pending',
                createDate: new Date(), createDateString: dateString, updateDate: new Date(), updateDateString: ''
            }
        )

        return res.redirect("/read/profile?username=" + reportUser);
    }, */

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

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result));
            return res.json(result);
        }
        return res.view('report/detail', { report: result });


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

        var title = req.body.title;
        var description = req.body.description.trim();
        var memberLimit = req.body.memberLimit;
        var attribution = req.body.attribution;
        var attribution2 = req.body.attribution2;
        var attribution3 = req.body.attribution3;
        var attribution4 = req.body.attribution4;
        var attribution5 = req.body.attribution5;
        var img = req.body.imgInput;

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
        // YYYY-MM-DDTHH:MM:SS
        var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

        memberLimit = parseInt(memberLimit);
        sails.log(title + ", " + description + ", " + memberLimit + ", " + attr);
        sails.log("Date string: " + dateString);

        var db = sails.getDatastore().manager;
        var result = await db.collection('post').insertOne(
            {
                HostUsername: req.session.memberid, HostNickname: req.session.nickname, creditScore: req.session.creditScore, post: {
                    title: title, description: description, memberLimit: memberLimit, attribution: attr, imgInput: img
                }, createDate: new Date(), createDateString: dateString, updateDate: new Date(), updateDateString: '', joinedMembers: [], joinedHistory: [], comments: []
            }

        )


        return res.redirect('/home');
        //return res.json(result);




    },

    home: async function (req, res) {

        var keywords = req.query.keywords;
        var range = req.query.range;
        var date = req.query.date;

        if (range) range = parseInt(range) + 1; // convert query string to integer
        if (date) {
            date = date + "T23:59:59";
            date = new Date(date);
        }

        sails.log(keywords + " " + range + " " + date);
        var search = keywords || range || date;

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
                            "post.memberLimit": { $lt: range || 101 }
                        },
                        {
                            "createDate": { $lte: date || new Date() }
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

    postDetail: async function (req, res) {

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
        return res.view('post/postDetail', { post: result });



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
            var id = req.params.id;
            var ObjectId = require('mongodb').ObjectId;
            var o_id = new ObjectId(id);

            var title = req.body.title;
            var description = req.body.description.trim();
            var memberLimit = req.body.memberLimit;
            var attribution = req.body.attribution;
            var attribution2 = req.body.attribution2;
            var attribution3 = req.body.attribution3;
            var attribution4 = req.body.attribution4;
            var attribution5 = req.body.attribution5;
            var img = req.body.imgInput;

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
            // YYYY-MM-DDTHH:MM:SS
            var dateString = year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s;

            memberLimit = parseInt(memberLimit);
            sails.log("editing the post (" + id + ")");
            sails.log("updated time: " + dateString);

            var db = sails.getDatastore().manager;
            var result = await db.collection('post').updateOne(
                { "_id": o_id },
                {
                    $set: { 'post.title': title, 'post.description': description, 'post.memberLimit': memberLimit, 'post.attribution': attr, 'post.imgInput': img, updateDate: new Date(), updateDateString: dateString }
                }
            )

            res.redirect("/manage");
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

    joinPost: async function (req, res) {


        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);

        var db = sails.getDatastore().manager;
        var result = await db.collection('post').findOne({ "_id": o_id });

        if (result) {

            // host user is not included in "joinedMembers"
            var memberCnt = result.joinedMembers.length;
            sails.log("Exisiting members count: " + memberCnt);

            // loop the exisiting members, check if current user is duplicated in DB?
            for (var i = 0; i < memberCnt; i++) {
                sails.log("[" + i + "] : " + result.joinedMembers[i]);
                if (result.joinedMembers[i] == req.session.memberid) {
                    // duplicated
                    sails.log("user duplicated in the DB!");
                    return res.redirect('/read/post/' + id);
                }
            }

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
            var dateString = day + "/" + month + "/" + year + " " + h + ":" + m + ":" + s;
            var timing = dateString + " - " + req.session.memberid + " has joined";
            sails.log("timing = " + timing);
            //update user count: push current session user to that post
            //push the successful joined record to DB
            await db.collection('post').updateOne(
                { "_id": o_id },
                { $push: { joinedMembers: req.session.memberid, joinedHistory: timing } }
            )


        } else {
            //return null
            return res.view('post/postDetail', { post: NULL });
        }

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result));
            return res.json(result);
        }

        sails.log(req.session.memberid + " request joining this post (" + id + ") ...")
        return res.redirect("/read/post/" + id);

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
        var dateString = day + "/" + month + "/" + year + " " + h + ":" + m + ":" + s;
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

        if (req.wantsJSON) {
            sails.log("returning detail page json data");
            sails.log("stringgify result: " + JSON.stringify(result));
            return res.json(result);
        }
        return res.redirect('/read/post/' + id);

    },

    comment: async function (req, res) {

        var id = req.params.id; // post id
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);
        var cm = req.params.cm.trim(); // comment content
        var username = req.session.memberid;
        var UserNickname = req.session.nickname;

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

        var db = sails.getDatastore().manager;
        var result = await db.collection('post').updateOne(
            { "_id": o_id },
            {
                $push: {
                    comments: {
                        content: cm, byUsername: username, byUserNickname: UserNickname, byDate: dateString
                    }
                }
            }
        )

        sails.log("result = " + result);
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

    deleteReport:  async function (req, res) {
        var id = req.params.id;
        var ObjectId = require('mongodb').ObjectId;
        var o_id = new ObjectId(id);
        
        var db = await sails.getDatastore().manager;
        await db.collection('report').remove({'_id':o_id});

        sails.log("deleted report ("+id+")");

        return res.redirect("/reporthandle");
    },


    test: function (req, res) {


        return res.view('test');

    },

    vip: function (req, res) {


        return res.view('profile/vipInfo');

    },


};

