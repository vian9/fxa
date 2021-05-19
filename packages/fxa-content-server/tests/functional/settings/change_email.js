/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('../lib/helpers');
const selectors = require('../lib/selectors');

const config = intern._config;

const ENTER_EMAIL_URL = config.fxaContentRoot;
const PASSWORD = 'passwordzxcv';
const NEW_PASSWORD = 'passwordzxcv1';

let email;
let secondaryEmail;
let newPrimaryEmail;

const {
  addAndVerifySecondaryEmail,
  clearBrowserState,
  click,
  createEmail,
  fillOutDeleteAccount,
  fillOutChangePassword,
  fillOutEmailFirstSignUp,
  fillOutEmailFirstSignIn,
  fillOutSignInUnblock,
  fillOutSignUpCode,
  openPage,
  signOut,
  testElementExists,
  testElementTextEquals,
  testElementTextInclude,
  testErrorTextInclude,
  testSuccessWasShown,
  type,
  visibleByQSA,
} = FunctionalHelpers;

registerSuite('settings change email', {
  beforeEach: function () {
    email = createEmail();
    secondaryEmail = createEmail();
    return (
      this.remote
        .then(clearBrowserState())
        .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
        .then(fillOutEmailFirstSignUp(email, PASSWORD))
        .then(testElementExists(selectors.CONFIRM_SIGNUP_CODE.HEADER))
        .then(fillOutSignUpCode(email, 0))

        .then(visibleByQSA(selectors.SETTINGS.PROFILE_HEADER))
        .then(click(selectors.EMAIL.MENU_BUTTON))

        .then(addAndVerifySecondaryEmail(secondaryEmail))
        .then(testSuccessWasShown())

        // set new primary email
        .then(
          click(
            selectors.SETTINGS.SECONDARY_EMAIL.MAKE_PRIMARY,
            selectors.EMAIL.SUCCESS
          )
        )
        .then(visibleByQSA(selectors.EMAIL.SUCCESS))

        .then(
          testElementTextEquals(selectors.EMAIL.ADDRESS_LABEL, secondaryEmail)
        )
    );
  },

  tests: {
    'can change primary email and login': function () {
      return (
        this.remote
          .then(signOut())

          // sign in with old primary email fails
          .then(openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER))
          .then(testElementExists(selectors.ENTER_EMAIL.HEADER))
          .then(fillOutEmailFirstSignIn(email, PASSWORD))
          .then(testErrorTextInclude('Primary account email required'))
          .then(
            click(
              selectors.SIGNIN_PASSWORD.LINK_USE_DIFFERENT,
              selectors.ENTER_EMAIL.HEADER
            )
          )

          // sign in with new primary email
          .then(fillOutEmailFirstSignIn(secondaryEmail, PASSWORD))

          // shows new primary email
          .then(testElementExists(selectors.SETTINGS.HEADER))
          .then(
            testElementTextEquals(
              selectors.SETTINGS.PROFILE_HEADER,
              secondaryEmail
            )
          )
      );
    },
  },
});
