import * as utils from 'library/utils';

export const handler = (event: any, context: any, callback: any) => {
  console.log(utils.test());

  callback(null, null);
};
