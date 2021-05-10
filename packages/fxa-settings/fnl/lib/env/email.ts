import got from 'got';

function wait() {
  return new Promise((r) => setTimeout(r, 50));
}

function toUsername(emailAddress: string) {
  return emailAddress.split('@')[0];
}

export enum EmailType {
  subscriptionReactivation,
  subscriptionUpgrade,
  subscriptionDowngrade,
  subscriptionPaymentExpired,
  subscriptionsPaymentExpired,
  subscriptionPaymentProviderCancelled,
  subscriptionsPaymentProviderCancelled,
  subscriptionPaymentFailed,
  subscriptionAccountDeletion,
  subscriptionCancellation,
  subscriptionSubsequentInvoice,
  subscriptionFirstInvoice,
  downloadSubscription,
  lowRecoveryCodes,
  newDeviceLogin,
  passwordChanged,
  passwordChangeRequired,
  passwordReset,
  passwordResetAccountRecovery,
  passwordResetRequired,
  postChangePrimary,
  postRemoveSecondary,
  postVerify,
  postVerifySecondary,
  postAddTwoStepAuthentication,
  postRemoveTwoStepAuthentication,
  postAddAccountRecovery,
  postRemoveAccountRecovery,
  postConsumeRecoveryCode,
  postNewRecoveryCodes,
  recovery,
  unblockCode,
  verify,
  verifySecondaryCode,
  verifyShortCode,
  verifyLogin,
  verifyLoginCode,
  verifyPrimary,
  verifySecondary,
  verificationReminderFirst,
  verificationReminderSecond,
  cadReminderFirst,
  cadReminderSecond,
}

export class EmailClient {
  static emailFromTestTitle(title: string) {
    return `${title
      .match(/(\w+)/g)
      .join('_')
      .substr(0, 30)
      .toLowerCase()}_${Math.floor(Math.random() * 100)}@restmail.net`;
  }
  constructor(private readonly host: string = 'http://restmail.net') {}

  async waitForEmail(
    emailAddress: string,
    type: EmailType,
    timeout: number = 15000
  ) {
    const expires = Date.now() + timeout;
    while (Date.now() < expires) {
      const mail = (await got(
        `${this.host}/mail/${toUsername(emailAddress)}`
      ).json()) as any[];
      const msg = mail.find(
        (m) => m.headers['x-template-name'] === EmailType[type]
      );
      if (msg) {
        return msg;
      }
      await wait();
    }
    throw new Error('EmailTimeout');
  }

  async clear(emailAddress: string) {
    await got.delete(`${this.host}/mail/${toUsername(emailAddress)}`);
  }
}
