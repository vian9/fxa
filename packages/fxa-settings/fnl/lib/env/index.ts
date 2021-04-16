import { BaseEnv } from './base';
import { LocalEnv } from './local';
import { StageEnv } from './stage';
import { ProductionEnv } from './production';

const environments = {
  [LocalEnv.env]: LocalEnv,
  [StageEnv.env]: StageEnv,
  [ProductionEnv.env]: ProductionEnv,
};

export type EnvName = keyof typeof environments;

export function create(name: EnvName): BaseEnv {
  return new environments[name]();
}
