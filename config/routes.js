/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  //'/': { view: 'pages/homepage' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/

  // ********* first landing page *********
  'GET /': 'UserController.landing',

  // home page: show all posts
  'GET /explore': 'UserController.Home',

  // login & signup process
  'GET /login': 'UserController.login',
  'POST /login': 'UserController.login',
  'GET /signup': 'UserController.signup',
  'POST /signup': 'UserController.signup',

  // disconnect gmail 
  'GET /disconnectGmail': 'UserController.disconnectGmail',

  // logout process
  'GET /logout': 'UserController.logout',

  // read post detail
  'GET /read/post/:id': 'UserController.postDetail',

  // terms & policy
  'GET /terms': 'UserController.terms',
  'GET /policy': 'UserController.policy',




  // *** member ***********************************************
  // create post
  'GET /create': 'UserController.post',
  'POST /create': 'UserController.post',

  // join post & leave post
  'POST /join/:id': 'UserController.joinPost',
  'POST /leave/post/:id': 'UserController.leavePost',

  // post comment 
  'POST /comment/:id/:cm': 'UserController.comment',

  // manage own posts
  'GET /manage': 'UserController.manage',
  'GET /manage/post/:id': 'UserController.editPostForm',
  'POST /manage/post/:id': 'UserController.editPostForm',

  // manage profile & read other's profile
  'GET /editProfile': 'UserController.editProfile',
  'POST /editProfile': 'UserController.editProfile',
  'GET /read/profile': 'UserController.userDetail',
  'GET /read/profile/notification': 'UserController.notiList',

  // report a user
  'POST /report': 'UserController.report',

  // report history 
  'GET /report/history': 'UserController.reportHistory',
  'GET /view/report/:id': 'UserController.viewReportOnly',

  // delete own notification
  'POST /delete/notification': 'UserController.delNoti',
  // *** member ***********************************************




  // *** admin ***********************************************
  // report handling
  'GET /reporthandle': 'UserController.reportHandle',
  'GET /read/report/:id': 'UserController.viewReport',
  'GET /admin/report/delete/:id': 'UserController.deleteReport',
  'POST /update/report/:id': 'UserController.updateReportStatus',

  //  send notification
  'POST /send/noti': 'UserController.sendNotification',

  // delete post in DB
  'POST /delete/post/:id': 'UserController.delPost',

  // display all users in DB
  'GET /userlist': 'UserController.showUsers',
   // *** admin ***********************************************




  // for testing purpose only
  'GET /test': 'UserController.test',

  // google Oauth api
  'GET /api/v1/auth/google': { controller: 'PassportController', action: 'googleAuth' },
  'GET /api/v1/auth/google/callback': { controller: 'PassportController', action: 'googleCallback' },


  


};
