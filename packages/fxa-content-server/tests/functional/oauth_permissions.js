/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');

const config = intern._config;

const TIMEOUT = 90 * 1000;

const TRUSTED_OAUTH_APP = config.fxaOAuthApp;
const UNTRUSTED_OAUTH_APP = config.fxaUntrustedOauthApp;
const PASSWORD = 'passwordzxcv';

const ENTER_EMAIL_URL = `${config.fxaContentRoot}?action=email`;

let email;

const {
  click,
  closeCurrentWindow,
  createEmail,
  createUser,
  fillOutForceAuth,
  fillOutEmailFirstSignIn,
  fillOutEmailFirstSignUp,
  fillOutSignInTokenCode,
  fillOutSignUpCode,
  noSuchElement,
  openFxaFromRp: openFxaFromTrustedRp,
  openFxaFromUntrustedRp,
  openPage,
  openSettingsInNewTab,
  switchToWindow,
  testElementExists,
  testUrlEquals,
  type,
  visibleByQSA,
} = FunctionalHelpers;

registerSuite('oauth permissions for trusted reliers', {
  beforeEach: function () {
    email = createEmail();

    return this.remote.then(
      FunctionalHelpers.clearBrowserState({
        '123done': true,
        contentServer: true,
      })
    );
  },

  tests: {

    'signin without `prompt=consent`, then re-signin with `prompt=consent`': function () {
      return (
        this.remote
          .then(createUser(email, PASSWORD, { preVerified: true }))
          .then(openFxaFromTrustedRp('enter-email'))
          .then(fillOutEmailFirstSignIn(email, PASSWORD))

          // no permissions asked for, straight to relier
          .then(testElementExists(selectors['123DONE'].AUTHENTICATED))
          .then(testUrlEquals(TRUSTED_OAUTH_APP))
          .then(click(selectors['123DONE'].LINK_LOGOUT))
          // currently there is no way to tell when 123done fully logged out
          // give the logout request some time to complete
          .sleep(1000)
          .then(visibleByQSA('#splash .signup'))

          // relier changes to request consent
          .then(
            openFxaFromTrustedRp('enter-email', {
              header: selectors.SIGNIN_PASSWORD.HEADER,
              query: { prompt: 'consent' },
            })
          )

          .then(click(selectors.SIGNIN_PASSWORD.SUBMIT_USE_SIGNED_IN))

          // since consent is now requested, user should see prompt
          .then(testElementExists(selectors.OAUTH_PERMISSIONS.HEADER))
          .then(click(selectors.OAUTH_PERMISSIONS.SUBMIT))

          .then(testElementExists(selectors['123DONE'].AUTHENTICATED))
      );
    },

  },
});
