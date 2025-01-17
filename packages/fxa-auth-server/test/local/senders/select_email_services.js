/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const ROOT_DIR = '../../..';

const { assert } = require('chai');
const config = require(`${ROOT_DIR}/config`).getProperties();
const mocks = require('../../mocks');
const proxyquire = require('proxyquire').noPreserveCache();
const sinon = require('sinon');

describe('selectEmailServices:', () => {
  const emailAddress = 'foo@example.com';
  const emailAddresses = ['a@example.com', 'b@example.com', 'c@example.com'];

  let log, redis, mailer, emailService, selectEmailServices, random;

  before(() => {
    log = mocks.mockLog();
    redis = {};
    mailer = { mailer: true };
    emailService = { emailService: true };
    selectEmailServices = proxyquire(
      `${ROOT_DIR}/lib/senders/select_email_services`,
      {
        '../redis': () => redis,
      }
    )(log, config, mailer, emailService);
    random = Math.random;
  });

  after(() => (Math.random = random));

  describe('redis.get returns sendgrid percentage-only match:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(JSON.stringify({ sendgrid: { percentage: 11 } }))
      );
      Math.random = () => 0.109;
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({ email: emailAddress });
      assert.deepEqual(result, [
        {
          mailer: emailService,
          emailAddresses: [emailAddress],
          emailService: 'fxa-email-service',
          emailSender: 'sendgrid',
        },
      ]);
    });
  });

  describe('redis.get returns sendgrid percentage-only mismatch:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(JSON.stringify({ sendgrid: { percentage: 11 } }))
      );
      Math.random = () => 0.11;
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({ email: emailAddress });
      assert.deepEqual(result, [
        {
          mailer: mailer,
          emailAddresses: [emailAddress],
          emailService: 'fxa-auth-server',
          emailSender: 'ses',
        },
      ]);
    });

    describe('redis.get returns sendgrid regex-only match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({ sendgrid: { regex: '^foo@example\\.com$' } })
          )
        );
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'sendgrid',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid regex-only mismatch:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({ sendgrid: { regex: '^fo@example\\.com$' } })
          )
        );
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid combined match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: {
                percentage: 1,
                regex: '^foo@example\\.com$',
              },
            })
          )
        );
        Math.random = () => 0.009;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'sendgrid',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid combined mismatch (percentage):', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: {
                percentage: 1,
                regex: '^foo@example\\.com$',
              },
            })
          )
        );
        Math.random = () => 0.01;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid combined mismatch (regex):', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: {
                percentage: 1,
                regex: '^ffoo@example\\.com$',
              },
            })
          )
        );
        Math.random = () => 0;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns socketlabs percentage-only match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(JSON.stringify({ socketlabs: { percentage: 42 } }))
        );
        Math.random = () => 0.419;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'socketlabs',
          },
        ]);
      });
    });

    describe('redis.get returns socketlabs percentage-only mismatch:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(JSON.stringify({ socketlabs: { percentage: 42 } }))
        );
        Math.random = () => 0.42;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns socketlabs regex-only match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({ socketlabs: { regex: '^foo@example\\.com$' } })
          )
        );
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'socketlabs',
          },
        ]);
      });
    });

    describe('redis.get returns ses percentage-only match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(JSON.stringify({ ses: { percentage: 100 } }))
        );
        Math.random = () => 0.999;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns ses percentage-only mismatch:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(JSON.stringify({ ses: { percentage: 99 } }))
        );
        Math.random = () => 0.999;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns ses regex-only match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({ ses: { regex: '^foo@example\\.com$' } })
          )
        );
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid and ses matches:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: { percentage: 10 },
              ses: { regex: '^foo@example\\.com$' },
            })
          )
        );
        Math.random = () => 0.09;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'sendgrid',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid match and ses mismatch:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: { percentage: 10 },
              ses: { regex: '^ffoo@example\\.com$' },
            })
          )
        );
        Math.random = () => 0.09;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'sendgrid',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid mismatch and ses match:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: { percentage: 10 },
              ses: { regex: '^foo@example\\.com$' },
            })
          )
        );
        Math.random = () => 0.1;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: emailService,
            emailAddresses: [emailAddress],
            emailService: 'fxa-email-service',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns sendgrid and ses mismatches:', () => {
      before(() => {
        redis.get = sinon.spy(() =>
          Promise.resolve(
            JSON.stringify({
              sendgrid: { percentage: 10 },
              ses: { regex: '^ffoo@example\\.com$' },
            })
          )
        );
        Math.random = () => 0.1;
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get returns undefined:', () => {
      before(() => {
        redis.get = sinon.spy(() => Promise.resolve());
      });

      it('selectEmailServices returns the correct data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
      });
    });

    describe('redis.get fails:', () => {
      before(() => {
        log.error.resetHistory();
        redis.get = sinon.spy(() => Promise.reject({ message: 'wibble' }));
      });

      it('selectEmailServices returns fallback data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
        assert.equal(log.error.callCount, 1);
        const args = log.error.args[0];
        assert.equal(args.length, 2);
        assert.equal(args[0], 'emailConfig.read.error');
        assert.deepEqual(args[1], {
          err: 'wibble',
        });
      });
    });

    describe('redis.get returns invalid JSON:', () => {
      before(() => {
        log.error.resetHistory();
        redis.get = sinon.spy(() => Promise.resolve('wibble'));
      });

      it('selectEmailServices returns fallback data', async () => {
        const result = await selectEmailServices({ email: emailAddress });
        assert.deepEqual(result, [
          {
            mailer: mailer,
            emailAddresses: [emailAddress],
            emailService: 'fxa-auth-server',
            emailSender: 'ses',
          },
        ]);
        assert.equal(log.error.callCount, 1);
        assert.equal(log.error.args[0][0], 'emailConfig.parse.error');
      });
    });
  });

  describe('redis.get returns sendgrid match:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(
          JSON.stringify({ sendgrid: { regex: 'example\\.com' } })
        )
      );
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({ email: emailAddress });
      assert.deepEqual(result, [
        {
          mailer: emailService,
          emailAddresses: [emailAddress],
          emailService: 'fxa-email-service',
          emailSender: 'sendgrid',
        },
      ]);
    });
  });

  describe('redis.get returns sendgrid mismatch:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(
          JSON.stringify({ sendgrid: { regex: 'example\\.org' } })
        )
      );
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({ email: emailAddress });
      assert.deepEqual(result, [
        {
          mailer: mailer,
          emailAddresses: [emailAddress],
          emailService: 'fxa-auth-server',
          emailSender: 'ses',
        },
      ]);
    });
  });

  describe('redis.get returns sendgrid and ses matches and a mismatch:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(
          JSON.stringify({
            sendgrid: { regex: '^a' },
            ses: { regex: '^b' },
          })
        )
      );
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({
        email: emailAddresses[0],
        ccEmails: emailAddresses.slice(1),
      });
      assert.deepEqual(result, [
        {
          mailer: emailService,
          emailAddresses: emailAddresses.slice(0, 1),
          emailService: 'fxa-email-service',
          emailSender: 'sendgrid',
        },
        {
          mailer: emailService,
          emailAddresses: emailAddresses.slice(1, 2),
          emailService: 'fxa-email-service',
          emailSender: 'ses',
        },
        {
          mailer: mailer,
          emailAddresses: emailAddresses.slice(2),
          emailService: 'fxa-auth-server',
          emailSender: 'ses',
        },
      ]);
    });
  });

  describe('redis.get returns a sendgrid match and two ses matches:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(
          JSON.stringify({
            sendgrid: { regex: '^a' },
            ses: { regex: '^b|c' },
          })
        )
      );
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({
        email: emailAddresses[0],
        ccEmails: emailAddresses.slice(1),
      });
      assert.deepEqual(result, [
        {
          mailer: emailService,
          emailAddresses: emailAddresses.slice(0, 1),
          emailService: 'fxa-email-service',
          emailSender: 'sendgrid',
        },
        {
          mailer: emailService,
          emailAddresses: emailAddresses.slice(1),
          emailService: 'fxa-email-service',
          emailSender: 'ses',
        },
      ]);
    });
  });

  describe('redis.get returns three mismatches:', () => {
    before(() => {
      redis.get = sinon.spy(() =>
        Promise.resolve(
          JSON.stringify({
            sendgrid: { regex: 'wibble' },
            ses: { regex: 'blee' },
          })
        )
      );
    });

    it('selectEmailServices returns the correct data', async () => {
      const result = await selectEmailServices({
        email: emailAddresses[0],
        ccEmails: emailAddresses.slice(1),
      });
      assert.deepEqual(result, [
        {
          mailer: mailer,
          emailAddresses: emailAddresses,
          emailService: 'fxa-auth-server',
          emailSender: 'ses',
        },
      ]);
    });
  });
});
