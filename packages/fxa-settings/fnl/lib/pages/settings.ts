import { Page } from 'playwright';
import {
  AvatarRow,
  ConnectedServicesRow,
  DisplayNameRow,
  PasswordRow,
  PrimaryEmailRow,
  RecoveryKeyRow,
  SecondaryEmailRow,
  TotpRow,
  UnitRow,
} from '../components/unitRow';
import { BasePage } from './base';

export class SettingsPage extends BasePage {
  readonly path = 'settings';
  private rows = new Map<string, UnitRow>();

  private lazyRow<T extends UnitRow>(
    id: string,
    RowType: { new (page: Page, id: string): T }
  ): T {
    if (!this.rows.has(id)) {
      this.rows.set(id, new RowType(this.page, id));
    }
    return this.rows.get(id) as T;
  }

  get avatar() {
    return this.lazyRow('avatar', AvatarRow);
  }

  get displayName() {
    return this.lazyRow('display-name', DisplayNameRow);
  }

  get password() {
    return this.lazyRow('password', PasswordRow);
  }

  get primaryEmail() {
    return this.lazyRow('primary-email', PrimaryEmailRow);
  }

  get secondaryEmail() {
    return this.lazyRow('secondary-email', SecondaryEmailRow);
  }

  get recoveryKey() {
    return this.lazyRow('recovery-key', RecoveryKeyRow);
  }

  get totp() {
    return this.lazyRow('two-step', TotpRow);
  }

  get connectedServices() {
    return this.lazyRow('connected-services', ConnectedServicesRow);
  }

  clickDeleteAccount() {
    return this.page.click('[data-testid=settings-delete-account]');
  }

  clickPaidSubscriptions() {
    return Promise.all([
      this.page.click('[data-testid=nav-link-subscriptions]'),
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
    ]);
  }
}
