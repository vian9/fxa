import { ElementHandle, Page } from 'playwright';
import { BasePage } from './base';

class ConnectedService {
  constructor(readonly element: ElementHandle<HTMLElement | SVGElement>) {}

  async name() {
    const p = await this.element.$('[data-testid=service-name]');
    return p.innerText();
  }

  async signout() {
    const button = await this.element.$(
      '[data-testid=connected-service-sign-out]'
    );
    return button.click();
  }
}

class UnitRow {
  constructor(readonly page: Page, readonly id: string) {}

  protected clickCta() {
    return this.page.click(`[data-testid=${this.id}-unit-row-route]`);
  }

  protected clickShowModal() {
    return this.page.click(`[data-testid=${this.id}-unit-row-modal]`);
  }

  protected clickShowSecondaryModal() {
    return this.page.click(`[data-testid=${this.id}-secondary-unit-row-modal]`);
  }

  statusText() {
    return this.page.innerText(
      `[data-testid=${this.id}-unit-row-header-value]`
    );
  }

  clickRefresh() {
    return this.page.click(`[data-testid=${this.id}-refresh]`);
  }
}

class AvatarRow extends UnitRow {
  async isDefault() {
    const el = await this.page.$('[data-testid=avatar-nondefault]');
    return !el;
  }

  clickAdd() {
    return this.clickCta();
  }
}

class DisplayNameRow extends UnitRow {
  clickAdd() {
    return this.clickCta();
  }
}

class PasswordRow extends UnitRow {
  clickChange() {
    return this.clickCta();
  }
}

class PrimaryEmailRow extends UnitRow {}

class SecondaryEmailRow extends UnitRow {
  clickAdd() {
    return this.clickCta();
  }
  clickMakePrimary() {
    return this.page.click('[data-testid=secondary-email-make-primary]');
  }
  clickDelete() {
    return this.page.click('[data-testid=secondary-email-delete]');
  }
}

class RecoveryKeyRow extends UnitRow {
  clickCreate() {
    return this.clickCta();
  }
  clickRemove() {
    return this.clickShowModal();
  }
}

class TotpRow extends UnitRow {
  clickAdd() {
    return this.clickCta();
  }
  clickChange() {
    return this.clickShowModal();
  }
  clickDisable() {
    return this.clickShowSecondaryModal();
  }
}

class ConnectedServicesRow extends UnitRow {
  async services() {
    const elements = await this.page.$$('#service');
    return elements.map((el) => new ConnectedService(el));
  }
}

export class SettingsPage extends BasePage {
  get avatar() {
    return new AvatarRow(this.page, 'avatar');
  }

  get displayName() {
    return new DisplayNameRow(this.page, 'display-name');
  }

  get password() {
    return new PasswordRow(this.page, 'password');
  }

  get primaryEmail() {
    return new PrimaryEmailRow(this.page, 'primary-email');
  }

  get secondaryEmail() {
    return new SecondaryEmailRow(this.page, 'secondary-email');
  }

  get recoveryKey() {
    return new RecoveryKeyRow(this.page, 'recovery-key');
  }

  get totp() {
    return new TotpRow(this.page, 'two-step');
  }

  get connectedServices() {
    return new ConnectedServicesRow(this.page, 'connected-services');
  }

  goto() {
    return this.page.goto(`${this.baseUrl}/settings`, {
      waitUntil: 'networkidle',
    });
  }

  alertBarText() {
    return this.page.innerText('[data-testid=alert-bar-content]');
  }

  async waitForAlertBar() {
    return this.page.waitForSelector('[data-testid=alert-bar-content]');
  }

  clickModalConfirm() {
    return Promise.all([
      this.page.click('[data-testid=modal-confirm]'),
      this.waitForAlertBar(),
    ]);
  }

  async logout() {
    await this.page.click('[data-testid=drop-down-avatar-menu-toggle]');
    await Promise.all([
      this.page.click('[data-testid=avatar-menu-sign-out]'),
      this.page.waitForNavigation(),
    ]);
  }

  clickDeleteAccount() {
    return this.page.click('[data-testid=settings-delete-account]');
  }
}
