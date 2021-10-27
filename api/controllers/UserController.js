/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {


    login: async function (req, res) {

        if (req.method == "GET") return res.view('loginForm', { status: '' });

        var username = req.body.username;
        var password = req.body.password;

        sails.log("username = " + username + " password = " + password);

        // call api
        
        // Get access to the native MongoDB client via the default Sails datastore.
        var db = sails.getDatastore().manager;

        // Find all users who own albums with the word "blue" in the title.
        // ("albums" would be defined in `api/models/User.js` as an attribute of type "json".)
        db.collection('user').find({ "albums.title": { "$regex": /blue/ } }).toArray(console.log);

        // response and return

        return res.ok();
    }

};

