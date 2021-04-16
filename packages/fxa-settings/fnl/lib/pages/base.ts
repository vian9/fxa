import { Page } from 'playwright';
import { BaseEnv } from '../env/base';

export class BasePage {
  constructor(protected readonly page: Page, protected readonly env: BaseEnv) {}

  protected get baseUrl() {
    return this.env.baseUrl;
  }
}
