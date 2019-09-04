import { extendsModel } from '@/utils';
import { DefineModel } from '@/utils/types';
import { Application } from 'egg';
import { Instance, STRING } from 'sequelize';
import yamlJoi from 'yaml-joi';

export interface Secret {
  secret: string;
  accountId: string;
}

export const DefineSecret: DefineModel<Secret> = {
  Attr: {
    accountId: {
      type: STRING(18),
      allowNull: false,
    },
    secret: {
      type: STRING(22),
      allowNull: false,
    },
  },
  Sample: {
    accountId: 'abcdefghijklmnopqr',
    secret: 'abcdefghijklmnopqrstuv',
  },
  Validator: yamlJoi(`
type: object
isSchema: true
limitation:
  - keys:
      accountId:
        type: string
        isSchema: true
        limitation:
          - length: 18
          - token: []
      secret:
        type: string
        isSchema: true
        limitation:
          - length: 22
          - token: []
  `),
};

export default (app: Application) => {
  const SecretModel = app.model.define<Instance<Secret>, Secret>('Secret', DefineSecret.Attr, {
    indexes: [{ name: 'PrimaryKey', unique: true, fields: ['accountId'] }],
  });
  SecretModel.removeAttribute('id');
  return extendsModel(SecretModel);
};
