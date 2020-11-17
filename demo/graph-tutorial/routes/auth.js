// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const router = require('express-promise-router')();
const graph = require('../graph');
const OAUTH_SCOPES = "User.Read,People.Read.All,User.Read.All,Sites.Read.All,Sites.ReadWrite.All";
const OAUTH_REDIRECT_URI = "https://consumirlibreriasbackend.herokuapp.com/auth/callback";

/* GET auth callback. */
router.get('/signin',
  async function (req, res) {
    const urlParameters = {
      scopes: OAUTH_SCOPES.split(','),
      redirectUri: OAUTH_REDIRECT_URI
    };

    try {
      const authUrl = await req.app.locals
        .msalClient.getAuthCodeUrl(urlParameters);
      console.log('signed in, redirecting ...');
      res.redirect(authUrl);
    }
    catch (error) {
      console.log(`Error: ${error}`);
      req.flash('error_msg', {
        message: 'Error getting auth URL',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      res.redirect('/');
    }
  }
);

// <CallbackSnippet>
router.get('/callback',
  async function(req, res) {
    const tokenRequest = {
      code: req.query.code,
      scopes: OAUTH_SCOPES.split(','),
      redirectUri: OAUTH_REDIRECT_URI
    };

    try {
      const response = await req.app.locals
        .msalClient.acquireTokenByCode(tokenRequest);

      // Save the user's homeAccountId in their session
      req.session.userId = response.account.homeAccountId;

      //const user = await graph.getUserDetails(response.accessToken);
      const spList = await graph.getSharePointList(response.accessToken);
      console.log('access token = ' + response.accessToken);
      // Add the user to user storage
      req.app.locals.users[req.session.userId] = {
        displayName: user.displayName,
        email: user.mail || user.userPrincipalName,
        timeZone: user.mailboxSettings.timeZone
      };
    } catch(error) {
      req.flash('error_msg', {
        message: 'Error completing authentication',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
    }

    res.redirect('/');
  }
);
// </CallbackSnippet>

router.get('/signout',
  async function(req, res) {
    // Sign out
    if (req.session.userId) {
      // Look up the user's account in the cache
      const accounts = await req.app.locals.msalClient
        .getTokenCache()
        .getAllAccounts();

      const userAccount = accounts.find(a => a.homeAccountId === req.session.userId);

      // Remove the account
      if (userAccount) {
        req.app.locals.msalClient
          .getTokenCache()
          .removeAccount(userAccount);
      }
    }

    // Destroy the user's session
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  }
);

module.exports = router;
