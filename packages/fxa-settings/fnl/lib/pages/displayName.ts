import { BasePage } from './base';

export class DisplayNamePage extends BasePage {
  goto() {
    return this.page.goto(`${this.baseUrl}/settings/display_name`);
  }

  displayName() {
    return this.page.$eval('input[type=text]', (el: any) => el.value);
  }

  setDisplayName(name: string) {
    return this.page.fill('input[type=text]', name);
  }

  submit() {
    return Promise.all([
      this.page.click('button[type=submit]'),
      this.page.waitForNavigation(),
    ]);
  }
}
