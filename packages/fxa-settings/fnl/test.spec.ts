import { test, multiTest, expect } from './config';

test.describe('misc', () => {
  test('set the display name', async ({ pages: { settings, displayName } }) => {
    await settings.goto();
    const name = await settings.displayName.statusText();
    expect(name).toEqual('None');
    await settings.displayName.clickAdd();
    await displayName.setDisplayName('me');
    await displayName.submit();
    const newName = await settings.displayName.statusText();
    expect(newName).toEqual('me');
  });

  test('change password', async ({
    pages: { settings, changePassword, login },
    credentials,
  }) => {
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
  });

  test('add and remove recovery key', async ({
    credentials,
    pages: { settings, recoveryKey },
  }) => {
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
  });

  test('add and remove totp', async ({ pages: { settings, totp } }) => {
    await settings.goto();
    let status = await settings.totp.statusText();
    expect(status).toEqual('Not set');
    await settings.totp.clickAdd();
    await totp.setSecurityCode();
    await totp.submit();
    const recoveryCode = await totp.getRecoveryCode();
    await totp.submit();
    await totp.setRecoveryCode(recoveryCode);
    await totp.submit();
    await settings.waitForAlertBar();
    status = await settings.totp.statusText();
    expect(status).toEqual('Enabled');
    await settings.totp.clickDisable();
    await settings.clickModalConfirm();
    status = await settings.totp.statusText();
    expect(status).toEqual('Not set');
  });

  multiTest('disconnect RP', async ({ credentials, browsers: [a, b] }) => {
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
});
