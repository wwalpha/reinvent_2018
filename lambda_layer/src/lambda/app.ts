import * as utils from 'library/utils';
import * as moment from 'moment';

export const handler = (event: any, context: any, callback: any) => {
  console.log(utils.test());
  console.log(moment.now());

  callback(null, null);
};
