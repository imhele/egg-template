import { changeRadix, HashType, makeHash, UUID, validate } from '@/utils';
import { NotFound } from '@/utils/errorcode';
import { Service } from 'egg';
import yamlJoi from 'yaml-joi';

/**
 * Service of auth
 */
export default class AuthService extends Service {
  static validator = {
    ActAuthV1Authorization: yamlJoi(`
type: object
limitation:
  - keys:
      accountId:
        type: string
        isSchema: true
        limitation:
          - length: 18
          - regex: !!js/regexp /^(?:[0-9a-zA-Z]*)$/
      expiryTime:
        type: number
        isSchema: true
        limitation:
          - min: 1000000000
          - max: 9999999999
          - integer: []
      hashType:
        type: string
        isSchema: true
        allowEmpty: nothing
        limitation:
          - default: SHA1-HMAC
      radixZip:
        type: boolean
        isSchema: true
        allowEmpty: nothing
        limitation:
          - default: false
`),
  };

  public async getSignContent(accountId: string, expiryTime: string | number) {
    const { redis } = this.app;
    const result = await redis.get(this.getSecretKey(accountId));
    return result && `${result}${expiryTime}`;
  }

  public async getActAuthV1Authorization(args: {
    accountId: string;
    expiryTime: number;
    radixZip: boolean;
    hashType: HashType;
  }) {
    const { accountId, expiryTime, radixZip, hashType } = validate(
      args,
      AuthService.validator.ActAuthV1Authorization,
    );
    const signContent = await this.getSignContent(accountId, expiryTime);
    if (!signContent) throw new NotFound(`account id \`${accountId}\` does not exists.`);
    let signature = makeHash(hashType, accountId, signContent);
    if (radixZip) signature = changeRadix(signature, { fromRadix: 16 });
    return [hashType, accountId, `${expiryTime}`, signature].join('_');
  }

  public async createAccount() {
    const { redis } = this.app;
    const { Secret } = this.ctx.model;
    const accountId = this.createNewaccountId();
    const secret = this.createNewSecret();
    await Promise.all([
      Secret.create({ secret, accountId }),
      redis.set(this.getSecretKey(accountId), secret),
    ]);
    return { accountId, secret };
  }

  // ***********
  // * PRIVATE *
  // ***********

  private getSecretKey(accountId: string) {
    return `secret:${accountId}`;
  }

  private createNewaccountId() {
    const randStr = changeRadix(UUID(), { fromRadix: 16 }).slice(0, 18);
    return randStr.padStart(18, 'u');
  }

  private createNewSecret() {
    // return changeRadix(UUID(), { fromRadix: 16 }).padStart(22, '0');
    return changeRadix(`1${UUID()}`, { fromRadix: 16 }).slice(0, 22);
  }
}
