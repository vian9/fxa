/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import crypto from 'crypto';
import { BaseModel } from '../base';
import { Knex } from 'knex';

export enum Proc {
  AccountRecord = 'accountRecord_7',
  AccountResetToken = 'accountResetToken_1',
  AccountDevices = 'accountDevices_16',
  ConsumeRecoveryCode = 'consumeRecoveryCode_3',
  ConsumeSigninCode = 'consumeSigninCode_4',
  ConsumeUnblockCode = 'consumeUnblockCode_3',
  CreateAccount = 'createAccount_9',
  CreateDevice = 'createDevice_5',
  CreateEmail = 'createEmail_2',
  CreateKeyFetchToken = 'createKeyFetchToken_2',
  CreatePasswordChangeToken = 'createPasswordChangeToken_2',
  CreatePasswordForgotToken = 'createPasswordForgotToken_2',
  CreateRecoveryCode = 'createRecoveryCode_3',
  CreateRecoveryKey = 'createRecoveryKey_4',
  CreateSecurityEvent = 'createSecurityEvent_3',
  CreateSessionToken = 'createSessionToken_9',
  CreateSigninCode = 'createSigninCode_2',
  CreateTotpToken = 'createTotpToken_1',
  CreateUnblockCode = 'createUnblockCode_1',
  DeleteAccount = 'deleteAccount_19',
  DeleteAccountResetToken = 'deleteAccountResetToken_1',
  DeleteDevice = 'deleteDevice_4',
  DeleteEmail = 'deleteEmail_5',
  DeleteKeyFetchToken = 'deleteKeyFetchToken_2',
  DeletePasswordChangeToken = 'deletePasswordChangeToken_1',
  DeletePasswordForgotToken = 'deletePasswordForgotToken_1',
  DeleteRecoveryCodes = 'deleteRecoveryCodes_1',
  DeleteRecoveryKey = 'deleteRecoveryKey_2',
  DeleteSecurityEvents = 'deleteSecurityEventsByUid_1',
  DeleteSessionToken = 'deleteSessionToken_4',
  DeleteTotpToken = 'deleteTotpToken_4',
  Device = 'device_3',
  DeviceFromTokenVerificationId = 'deviceFromTokenVerificationId_6',
  EmailBounces = 'fetchEmailBounces_1',
  ForgotPasswordVerified = 'forgotPasswordVerified_8',
  KeyFetchToken = 'keyFetchToken_1',
  KeyFetchTokenWithVerificationStatus = 'keyFetchTokenWithVerificationStatus_2',
  PasswordChangeToken = 'passwordChangeToken_3',
  PasswordForgotToken = 'passwordForgotToken_2',
  PurgeAvailableCommands = 'purgeAvailableCommands_1',
  RecoveryCodes = 'recoveryCodes_1',
  RecoveryKey = 'getRecoveryKey_4',
  ResetAccount = 'resetAccount_16',
  ResetAccountTokens = 'resetAccountTokens_1',
  SessionWithDevice = 'sessionWithDevice_18',
  Sessions = 'sessions_11',
  SetPrimaryEmail = 'setPrimaryEmail_6',
  TotpToken = 'totpToken_2',
  UpdateDevice = 'updateDevice_6',
  UpdateRecoveryKey = 'updateRecoveryKey_1',
  UpdateSessionToken = 'updateSessionToken_3',
  UpdateTotpToken = 'updateTotpToken_4',
  UpsertAvailableCommands = 'upsertAvailableCommand_1',
  VerifyEmail = 'verifyEmail_9',
  VerifyToken = 'verifyToken_3',
  VerifyTokenCode = 'verifyTokenCode_2',
  VerifyTokenWithMethod = 'verifyTokensWithMethod_3',
}

function callString(name: Proc, argCount: number) {
  const qs = new Array(argCount).fill('?').join(',');
  return `Call ${name}(${qs})`;
}

export type QueryStatus = {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
};

export abstract class BaseAuthModel extends BaseModel {
  static async callProcedure(
    name: Proc,
    txn: Knex.Transaction,
    ...args: any[]
  ): Promise<{ status: QueryStatus; rows: any[] }>;
  static async callProcedure(
    name: Proc,
    ...args: any[]
  ): Promise<{ status: QueryStatus; rows: any[] }>;
  static async callProcedure(name: Proc, ...args: any[]) {
    let [txn, ...rest] = args;
    const knex = this.knex() as Knex;
    const query =
      txn && typeof txn.commit === 'function'
        ? knex.raw(callString(name, rest.length), rest).transacting(txn)
        : knex.raw(callString(name, args.length), args);
    const [result] = await query;
    if (Array.isArray(result)) {
      return { status: result.pop(), rows: result.shift() };
    }
    return { status: result, rows: [] };
  }

  static sha256(hex: string | Buffer) {
    const data = typeof hex === 'string' ? Buffer.from(hex, 'hex') : hex;
    return crypto.createHash('sha256').update(data).digest();
  }
}