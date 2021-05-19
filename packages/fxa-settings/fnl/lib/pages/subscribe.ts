import { BasePage } from './base';

export class SubscribePage extends BasePage {
  setFullName(name: string = 'Cave Johnson') {
    return this.page.fill('[data-testid="name"]', name);
  }

  async setCreditCardInfo() {
    const frames = this.page.frames();
    const f = frames[frames.length - 1];
    await f.fill('.InputElement[name=cardnumber]', '4242424242424242');
    await f.fill('.InputElement[name=exp-date]', '555');
    await f.fill('.InputElement[name=cvc]', '333');
    await f.fill('.InputElement[name=postal]', '66666');
    await this.page.check('input[type=checkbox]');
  }

  submit() {
    return Promise.all([
      this.page.click('button[type=submit]'),
      this.page.waitForResponse(
        (r) =>
          r.request().method() === 'GET' &&
          /\/subscriptions\/customer$/.test(r.request().url())
      ),
    ]);
  }
}
