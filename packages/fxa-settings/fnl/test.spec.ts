import { test as basicTest, expect } from './lib/testTypes/serialTest';
import { test } from './lib/testTypes/multiTest';
import { EmailType } from './lib/targets/email';

basicTest(
  'set the display name',
  async ({ pages: { settings, displayName } }) => {
    await settings.goto();
    const name = await settings.displayName.statusText();
    expect(name).toEqual('None');
    await settings.displayName.clickAdd();
    await displayName.setDisplayName('me');
    await displayName.submit();
    const newName = await settings.displayName.statusText();
    expect(newName).toEqual('me');
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
  'change email and login',
  async ({ credentials, env, pages: { login, settings, secondaryEmail } }) => {
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
    const recoveryCodes = await totp.enable();
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
    const msg = await env.email.waitForEmail(
      credentials.email,
      EmailType.lowRecoveryCodes
    );
    const link = msg.headers['x-link'] as string;
    await page.goto(link, { waitUntil: 'networkidle' });
    const newCodes = await totp.getRecoveryCodes();
    expect(newCodes.length).toEqual(recoveryCodes.length);

    await settings.goto();
    await settings.totp.clickDisable();
    await settings.clickModalConfirm();
  }
);

basicTest('mocha tests', async ({ env, pages: { page } }, info) => {
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
});

test.describe('more', () => {
  // test.useOptions({ browsers: 1 })
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
