/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('../lib/helpers');
const selectors = require('../lib/selectors');

const config = intern._config;
const ENTER_EMAIL_URL = config.fxaContentRoot;

const ANIMATION_DELAY_MS = 500;
const FIRST_PASSWORD = 'password';
const SECOND_PASSWORD = 'new_password';

let email;

const {
  clearBrowserState,
  click,
  createEmail,
  createUser,
  denormalizeStoredEmail,
  fillOutChangePassword,
  fillOutEmailFirstSignIn,
  noSuchElement,
  openPage,
  pollUntilHiddenByQSA,
  testElementExists,
  testElementTextEquals,
  thenify,
  type,
  visibleByQSA,
} = FunctionalHelpers;

const setupTest = thenify(function (options = {}) {
  const signUpEmail = options.signUpEmail || email;
  const signInEmail = options.signInEmail || email;

  return this.parent
    .then(createUser(signUpEmail, FIRST_PASSWORD, { preVerified: true }))
    .then(clearBrowserState())
    .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
    .then(fillOutEmailFirstSignIn(signInEmail, FIRST_PASSWORD))

    .then(testElementExists(selectors.SETTINGS.HEADER))
    .then(
      testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, signUpEmail)
    );
});

registerSuite('change password', {
  beforeEach: function () {
    email = createEmail();
  },

  tests: {
    'change password, sign in with new password': function () {
      return (
        this.remote
          .then(setupTest())

          // Go to change password screen
          .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))

          .then(fillOutChangePassword(FIRST_PASSWORD, SECOND_PASSWORD))

          .then(clearBrowserState())
          .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
          .then(fillOutEmailFirstSignIn(email, SECOND_PASSWORD))

          .then(testElementExists(selectors.SETTINGS.HEADER))
      );
    },
  },
});
