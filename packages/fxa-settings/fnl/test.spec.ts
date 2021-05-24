import { test as basicTest, expect } from './lib/testTypes/serialTest';
import { test } from './lib/testTypes/multiTest';
import { EmailHeader, EmailType } from './lib/targets/email';

basicTest.describe('core', () => {
  basicTest.beforeAll(async ({ context, env }) => {
    // warmup the browser cache
    const page = await context.newPage();
    await page.goto(env.contentServerUrl + '/settings', {
      waitUntil: 'networkidle',
    });
    await page.close();
  });

  basicTest(
    'set/unset the display name',
    async ({ pages: { settings, displayName } }) => {
      await settings.goto();
      expect(await settings.displayName.statusText()).toEqual('None');
      await settings.displayName.clickAdd();
      await displayName.setDisplayName('me');
      await displayName.submit();
      expect(await settings.displayName.statusText()).toEqual('me');
      await settings.displayName.clickAdd();
      await displayName.setDisplayName('');
      await displayName.submit();
      expect(await settings.displayName.statusText()).toEqual('None');
    }
  );

  basicTest(
    'change password',
    async ({ pages: { settings, changePassword, login }, credentials }) => {
      const newPassword = credentials.password + '2';
      await settings.goto();
      await settings.password.clickChange();
      await changePassword.setCurrentPassword(credentials.password);
      await changePassword.setNewPassword(newPassword);
      await changePassword.setConfirmPassword(newPassword);
      await changePassword.submit();
      await settings.logout();
      credentials.password = newPassword;
      await login.login(credentials.email, credentials.password);
      const primaryEmail = await settings.primaryEmail.statusText();
      expect(primaryEmail).toEqual(credentials.email);
    }
  );

  basicTest(
    'add and remove recovery key',
    async ({ credentials, pages: { settings, recoveryKey } }) => {
      await settings.goto();
      let status = await settings.recoveryKey.statusText();
      expect(status).toEqual('Not set');
      await settings.recoveryKey.clickCreate();
      await recoveryKey.setPassword(credentials.password);
      await recoveryKey.submit();
      await recoveryKey.clickClose();
      status = await settings.recoveryKey.statusText();
      expect(status).toEqual('Enabled');
      await settings.recoveryKey.clickRemove();
      await settings.clickModalConfirm();
      status = await settings.recoveryKey.statusText();
      expect(status).toEqual('Not set');
    }
  );

  basicTest(
    'use recovery key',
    async ({
      credentials,
      env,
      pages: { page, login, recoveryKey, settings },
    }) => {
      await settings.goto();
      await settings.recoveryKey.clickCreate();
      await recoveryKey.setPassword(credentials.password);
      await recoveryKey.submit();
      const key = await recoveryKey.getKey();
      await settings.logout();
      await login.setEmail(credentials.email);
      await login.submit();
      await login.clickForgotPassword();
      await login.setEmail(credentials.email);
      await login.submit();
      const link = await env.email.waitForEmail(
        credentials.email,
        EmailType.recovery,
        EmailHeader.link
      );
      await page.goto(link, { waitUntil: 'networkidle' });
      await login.setRecoveryKey(key);
      await login.submit();
      credentials.password = credentials.password + '_new';
      await login.setNewPassword(credentials.password);
      await settings.waitForAlertBar();
      await settings.logout();
      await login.login(credentials.email, credentials.password);
      const status = await settings.recoveryKey.statusText();
      expect(status).toEqual('Not set');
    }
  );

  basicTest('add and remove totp', async ({ pages: { settings, totp } }) => {
    await settings.goto();
    let status = await settings.totp.statusText();
    expect(status).toEqual('Not set');
    await settings.totp.clickAdd();
    await totp.enable();
    await settings.waitForAlertBar();
    status = await settings.totp.statusText();
    expect(status).toEqual('Enabled');
    await settings.totp.clickDisable();
    await settings.clickModalConfirm();
    status = await settings.totp.statusText();
    expect(status).toEqual('Not set');
  });

  basicTest(
    'add TOTP and login',
    async ({ credentials, pages: { page, login, settings, totp } }) => {
      await settings.goto();
      await settings.totp.clickAdd();
      const { secret } = await totp.enable();
      await settings.logout();
      await login.login(credentials.email, credentials.password);
      await login.setTotp(secret);
      const status = await settings.totp.statusText();
      expect(status).toEqual('Enabled');
      await settings.totp.clickDisable();
      await settings.clickModalConfirm();
    }
  );

  basicTest(
    'change email and login',
    async ({
      credentials,
      env,
      pages: { login, settings, secondaryEmail },
    }) => {
      await settings.goto();
      await settings.secondaryEmail.clickAdd();
      const newEmail = credentials.email.replace(/(\w+)/, '$1_alt');
      await secondaryEmail.addAndVerify(newEmail);
      await settings.waitForAlertBar();
      await settings.secondaryEmail.clickMakePrimary();
      credentials.email = newEmail;
      await settings.logout();
      await login.login(credentials.email, credentials.password);
      const primary = await settings.primaryEmail.statusText();
      expect(primary).toEqual(newEmail);
    }
  );

  basicTest(
    'can get new recovery codes via email',
    async ({ env, credentials, pages: { page, login, settings, totp } }) => {
      await settings.goto();
      await settings.totp.clickAdd();
      const { recoveryCodes } = await totp.enable();
      await settings.logout();
      for (let i = 0; i < recoveryCodes.length - 3; i++) {
        await login.login(
          credentials.email,
          credentials.password,
          recoveryCodes[i]
        );
        await settings.logout();
      }
      await login.login(
        credentials.email,
        credentials.password,
        recoveryCodes[recoveryCodes.length - 1]
      );
      const link = await env.email.waitForEmail(
        credentials.email,
        EmailType.lowRecoveryCodes,
        EmailHeader.link
      );
      await page.goto(link, { waitUntil: 'networkidle' });
      const newCodes = await totp.getRecoveryCodes();
      expect(newCodes.length).toEqual(recoveryCodes.length);

      await settings.goto();
      await settings.totp.clickDisable();
      await settings.clickModalConfirm();
    }
  );

  basicTest(
    'subscribe and login to product',
    async ({ pages: { page, relier, login, subscribe } }) => {
      basicTest.slow();
      await relier.goto();
      await relier.clickSubscribe();
      await subscribe.setFullName();
      await subscribe.setCreditCardInfo();
      await subscribe.submit();
      await relier.goto();
      await relier.clickEmailFirst();
      await login.submit();
      expect(await relier.isPro()).toBe(true);
    }
  );

  basicTest(
    'content-server mocha tests',
    async ({ env, pages: { page } }, info) => {
      basicTest.skip(info.project.name !== 'local');
      basicTest.slow();
      await page.goto(`${env.contentServerUrl}/tests/index.html`, {
        waitUntil: 'networkidle',
      });
      await page.evaluate(() =>
        globalThis.runner.on('end', () => (globalThis.done = true))
      );
      await page.waitForFunction(() => globalThis.done, {}, { timeout: 0 });
      const failures = await page.evaluate(() => globalThis.runner.failures);
      expect(failures).toBe(0);
    }
  );
});

test('delete account', async ({
  credentials,
  browsers: [{ login, settings, deleteAccount, page }],
}) => {
  await login.useCredentials(credentials);
  await settings.goto();
  await settings.clickDeleteAccount();
  await deleteAccount.checkAllBoxes();
  await deleteAccount.clickContinue();
  await deleteAccount.setPassword(credentials.password);
  await deleteAccount.submit();
  const success = await page.waitForSelector('.success');
  expect(await success.isVisible()).toBeTruthy();
});

test('change email and unblock', async ({
  credentials,
  browsers: [{ page, login, settings, secondaryEmail }],
}) => {
  await login.useCredentials(credentials);
  await settings.goto();
  await settings.secondaryEmail.clickAdd();
  const newEmail = `blocked${Math.floor(Math.random() * 100)}@restmail.net`;
  await secondaryEmail.addAndVerify(newEmail);
  await settings.secondaryEmail.clickMakePrimary();
  credentials.email = newEmail;
  await settings.logout();
  await login.login(credentials.email, credentials.password);
  await login.unblock(newEmail);
  expect(page.url()).toBe(settings.url);
});

test('disconnect RP', async ({ credentials, browsers: [a, b] }) => {
  await b.relier.goto();
  await b.relier.clickEmailFirst();
  await b.login.login(credentials.email, credentials.password);

  await a.login.goto();
  await a.login.login(credentials.email, credentials.password);

  let services = await a.settings.connectedServices.services();
  expect(services.length).toEqual(2);
  const relier = services[1];
  await relier.signout();
  await a.settings.waitForAlertBar();
  services = await a.settings.connectedServices.services();
  expect(services.length).toEqual(1);
});

test('prompt=consent', async ({
  credentials,
  browsers: [{ page, relier, login }],
}) => {
  await relier.goto();
  await relier.clickEmailFirst();
  await login.login(credentials.email, credentials.password);
  expect(await relier.isLoggedIn()).toBe(true);
  await relier.logout();
  await relier.goto('prompt=consent');
  await relier.clickEmailFirst();
  await login.submit();
  expect(page.url()).toMatch(/signin_permissions/);
  await login.submit();
  expect(await relier.isLoggedIn()).toBe(true);
});
