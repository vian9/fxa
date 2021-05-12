import { EnvName } from '.';
import { RemoteEnv } from './remote';

export class ProductionEnv extends RemoteEnv {
  static readonly env = 'production';
  readonly name: EnvName = ProductionEnv.env;
  readonly contentServerUrl = 'https://accounts.firefox.com';
  readonly relierUrl = 'https://123done.org';

  constructor() {
    super('https://api.accounts.firefox.com');
  }
}
