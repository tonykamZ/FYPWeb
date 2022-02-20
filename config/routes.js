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


  'GET /': { view: 'landingPage' },
  'GET /home': 'UserController.Home',
  'GET /login': 'UserController.login',
  'POST /login': 'UserController.login',
  'GET /signup': 'UserController.signup',
  'POST /signup': 'UserController.signup',

  'GET /disconnectGmail': 'UserController.disconnectGmail',
  'GET /logout': 'UserController.logout',

  'GET /post': 'UserController.post',
  'POST /post': 'UserController.post',
  'GET /read/post/:id': 'UserController.postDetail',

  'GET /join/:id': 'UserController.joinPost',
  'GET /leave/post/:id': 'UserController.leavePost',

  'POST /comment/:id/:cm': 'UserController.comment',

  'GET /manage': 'UserController.manage',
  'GET /manage/post/:id': 'UserController.editPostForm',
  'POST /manage/post/:id': 'UserController.editPostForm',


  'GET /editProfile': 'UserController.editProfile',
  'POST /editProfile': 'UserController.editProfile',
  'GET /read/profile': 'UserController.userDetail',
  'GET /read/profile/notification': 'UserController.notiList',

  'POST /report': 'UserController.report',

  'POST /delete/notification': 'UserController.delNoti',
  


  // admin
  // report
  'GET /reporthandle': 'UserController.reportHandle',
  'GET /read/report/:id': 'UserController.viewReport',
  'GET /admin/report/delete/:id': 'UserController.deleteReport',
  'POST /update/report/:id': 'UserController.updateReportStatus',

  // notification
  'POST /send/noti': 'UserController.sendNotification',

  // delete post
  'POST /delete/post/:id': 'UserController.delPost',

  'GET /member/vip': 'UserController.vip',

  'GET /test': 'UserController.test',

  'GET /api/v1/auth/google': { controller: 'PassportController', action: 'googleAuth' },
  'GET /api/v1/auth/google/callback': { controller: 'PassportController', action: 'googleCallback' },



  // admin

  'GET /userlist': 'UserController.showUsers',


};
