import { ElementHandle } from 'playwright';

export class ConnectedService {
  constructor(readonly element: ElementHandle<HTMLElement | SVGElement>) {}

  async name() {
    const p = await this.element.waitForSelector('[data-testid=service-name]');
    return p.innerText();
  }

  async signout() {
    const button = await this.element.waitForSelector(
      '[data-testid=connected-service-sign-out]'
    );
    return button.click();
  }
}
