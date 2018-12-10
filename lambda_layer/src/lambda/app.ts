import * as utils from 'library/utils';
import * as moment from 'moment';

export const handler = (event: any, context: any, callback: any) => {
  // 共通処理のライブラリ
  console.log(utils.test());
  // 外部のライブラリ
  console.log(moment.now());

  callback(null, null);
};
