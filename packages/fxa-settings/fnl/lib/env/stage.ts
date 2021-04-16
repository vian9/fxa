import { EnvName } from '.';
import { RemoteEnv } from './remote';

export class StageEnv extends RemoteEnv {
  static readonly env = 'stage';
  readonly name: EnvName = StageEnv.env;
  readonly contentServerUrl = 'https://accounts.stage.mozaws.net';
  readonly relierUrl = 'https://123done-stage.dev.lcip.org';

  constructor() {
    super('https://api-accounts.stage.mozaws.net');
  }
}
