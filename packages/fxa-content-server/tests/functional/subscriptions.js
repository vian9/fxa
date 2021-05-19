/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');
/*eslint-disable camelcase */
const productIdNameMap = {
  prod_GqM9ToKK62qjkK: '123Done Pro',
  prod_FiJ42WCzZNRSbS: 'mozilla vpn',
};
/*eslint-enable camelcase*/

const {
  clearBrowserState,
  click,
  createEmail,
  createUserAndLoadSettings,
  getTestProductSubscriptionUrl,
  openPage,
  signInToTestProduct,
  subscribeAndSigninToRp,
  subscribeToTestProductWithCardNumber,
  testElementTextInclude,
  visibleByQSA,
} = FunctionalHelpers;

registerSuite('subscriptions', {
  tests: {
    'sign up, subscribe, sign in to verify subscription': function () {
      if (
        process.env.CIRCLECI === 'true' &&
        !process.env.SUBHUB_STRIPE_APIKEY
      ) {
        this.skip('missing Stripe API key in CircleCI run');
      }
      const email = createEmail();
      return this.remote.then(subscribeAndSigninToRp(email));
    },
  },
});
