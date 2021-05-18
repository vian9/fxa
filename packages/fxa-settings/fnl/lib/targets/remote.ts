import { BaseEnv, Credentials } from './base';
import { EmailType } from './email';

export abstract class RemoteEnv extends BaseEnv {
  async createAccount(email: string, password: string): Promise<Credentials> {
    const creds = await this.auth.signUp(email, password);
    const code = await this.email.waitForEmail(
      email,
      EmailType.verify,
      'x-verify-code'
    );
    await this.auth.verifyCode(creds.uid, code);
    await this.email.clear(email);
    return {
      email,
      password,
      ...creds,
    };
  }
}
