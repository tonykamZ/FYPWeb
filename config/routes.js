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


  'GET /': 'UserController.home',
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

  
  'GET /editProfile' :  'UserController.editProfile',
  'POST /editProfile' :  'UserController.editProfile',
  'GET /read/profile': 'UserController.userDetail',

  'GET /api/v1/auth/google': { controller: 'PassportController', action: 'googleAuth' },
  'GET /api/v1/auth/google/callback': { controller: 'PassportController', action: 'googleCallback' },
};
