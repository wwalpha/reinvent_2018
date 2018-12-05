# Lambda Layer Example
AWS re:Invent 2018にて AWS Lambda Layers が発表されました。

今まで複数の Lambda ファンクションから呼び出すライブラリがあっても各ファンクションごとにパッケージングする必要がありました。

今回発表された AWS Lambda Layers を利用することで共通モジュール / 共通処理を Layer 化して複数の Lambda ファンクションから利用することができるようです。

## Lambda Layer の制限
* 最大同時５つ Layers 使える
  * A function can use up to 5 layers at a time
* Function と 全ての Layers、解凍後、250MB超えな
  * The total unzipped size of the function and all layers can't exceed the unzipped deployment package size limit of 250 MB.いこと

## Exampleの流れ
* Layer 用共通ライブラリの作成 (src/library/utils.ts)
* Layer 用外部ライブラリの構成 (nodejs)
* テストコード作成 (src/lambda/app.ts)
* リリースモジュール作成
* 出力物の構成

### Layer 用共通ライブラリの作成
コンソールにメッセージ出力のファンクションを作成する

```js
export const test = () => console.log('Lambda Layer Test.');
```

### Layer 用外部ライブラリの構成
nodejsフォルダにて、`moment`をインストールする

```sh
npm install moment
```

### テストコードの作成
Layer のライブラリを呼び出し、コンソールに出力する

```js
import * as utils from 'library/utils';
import * as moment from 'moment';

export const handler = (event: any, context: any, callback: any) => {
  console.log(utils.test());
  console.log(moment);

  callback(null, null);
};
```

### リリースモジュール作成
`package.json`のscriptで管理しているタスクを実行する

```
npm run deploy
```

### 出力物の構成
* dist/function.zip (Function Source)
* dist/nodejs.zip (Layer Source)