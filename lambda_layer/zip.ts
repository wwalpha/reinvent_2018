import * as fs from 'fs';
import * as path from 'path';
import * as jszip from 'jszip';

const zip = new jszip();

const excepts = [];
const fileExcepts = [''];

const isExcept = (filename: string, parent?: string) => {
  const exclude = excepts.find(item => item === filename) !== undefined;

  return exclude;
};

const add = (jszip: jszip, filepath: string, parent?: string) => {
  if (fs.statSync(filepath).isFile()) {

    // console.log(filepath);
    jszip.file(path.basename(filepath), fs.readFileSync(filepath));
    return;
  }

  fs.readdirSync(filepath).forEach((filename: string) => {
    if (isExcept(filename, filepath)) return;

    const file = path.join(filepath, filename);

    if (fs.statSync(file).isDirectory()) {
      return add(jszip.folder(filename), file, filepath);
    }

    // console.log(file);
    jszip.file(filename, fs.readFileSync(file));
  });
};

add(zip, path.join(__dirname));

zip.generateAsync({
  type: 'uint8array',
  compression: 'DEFLATE',
}).then((value) => {
  fs.writeFileSync(path.join(__dirname, './codebuild-1.0.zip'), value);

  console.log('build finish...');

  const cmd = 'aws s3 cp codebuild-1.0.zip s3://takumi-ai-codebuild --profile=switchrole';
  const utils = require('./deploy/utils');

  utils.execCmd(cmd);
});
