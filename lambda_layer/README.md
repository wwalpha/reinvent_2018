# re:Invent 2018 検証実験： Lambda Layer

## 概要
今まで複数の Lambda ファンクションから呼び出すライブラリがあっても各ファンクションごとにパッケージングする必要がありました。

今回発表された AWS Lambda Layers を利用することで共通モジュール / 共通処理を Layer 化して複数の Lambda ファンクションから利用することができるようです。

## Lambda Layer の制限
* Functionごと、最大同時５つ Layers 使える
  * A function can use up to 5 layers at a time
* Function と 全ての Layers、解凍後、250MB超えないこと
  * The total unzipped size of the function and all layers can't exceed the unzipped deployment package size limit of 250 MB.

<br />

## 事前準備
### ライブラリ
* Node.js
* aws cli

### インストール
* npm install
* npm install typescript -g

### サンプル
* 共通処理のライブラリ
* 外部のライブラリ
* テスト用コード

<br />

## サンプルの作成
### 共通処理のライブラリ
コンソールにメッセージ出力のファンクションを作成する

* src/lambda/app.ts
```js
export const test = () => console.log('Lambda Layer Test.');
```

### 外部のライブラリ
外部のライブラリを指定フォルダに事前インストールする

```sh
cd nodejs && npm install
or
npm run initial
```

### テストコード
両方ライブラリの関数の実行結果が表示されれば、成功とする

```js
import * as utils from 'library/utils';
import * as moment from 'moment';

export const handler = (event: any, context: any, callback: any) => {
  // 共通処理のライブラリ
  console.log(utils.test());
  // 外部のライブラリ
  console.log(moment.now());

  callback(null, null);
};
```

### Lambda Layer用モジュールを作成
`package.json`のscriptsで管理しているタスクを実行する

```sh
npm run release
```
```js
...
  "scripts": {
    "initial": "cd nodejs && npm install",
    "release": "npm run build && npm run package",
    "prebuild": "rimraf dist && rimraf nodejs/node_modules/library",
    "build:src": "tsc",
    "build:lib": "tsc -p tsconfig_lib.json",
    "build": "npm run build:src && npm run build:lib",
    "package:src": "cd dist/lambda && zip -r ../lambda.zip *",
    "package:lib": "zip -r dist/nodejs.zip nodejs",
    "package": "npm run package:src && npm run package:lib"
  },
...
```

### 成果物の確認
`dist`フォルダに下記`zip`ファイルが作られました

* function.zip (Function Source)
* nodejs.zip (Layer Source)

## 検証環境の構築
検証環境の構築は、`CloudFormation`のテンプレートを用意しました。

### テンプレート
```
AWSTemplateFormatVersion: 2010-09-09

Resources:
  ExPoliy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: LambdaLayer_LambdaBasicExecution
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          -
            Sid: LambdaLogs
            Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: !Sub 'arn:aws:logs:${AWS::Region}:*:*'
      Roles:
        - !Ref ExRole

  ExRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: LambdaLayer_LayerRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement: 
          - 
            Effect: Allow
            Principal: 
              Service: 
                - lambda.amazonaws.com
            Action: 
              - sts:AssumeRole
      Path: '/'

  ExFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: LambdaLayer_Function
      Handler: app.handler
      Role: !GetAtt ExRole.Arn
      Runtime: nodejs8.10
      Code:
        S3Bucket: reinvent-2018-examples
        S3Key: lambda_layer/lambda.zip
      Layers:
        - !Ref ExLayer

  ExLayer:
    Type: AWS::Lambda::LayerVersion
    Properties:
      CompatibleRuntimes:
        - nodejs8.10
      LayerName: LambdaLayer_Layer
      LicenseInfo: MIT
      Content:
        S3Bucket: reinvent-2018-examples
        S3Key: lambda_layer/nodejs.zip

  ExLayerPermission:
    Type: AWS::Lambda::LayerVersionPermission
    Properties:
      Action: lambda:GetLayerVersion
      LayerVersionArn: !Ref ExLayer
      Principal: '*'
```

### テンプレートの実行
```sh
aws cloudformation deploy --template-file ./cfn/lambda_layer.yml --stack-name lambda-layer-example --capabilities CAPABILITY_NAMED_IAM
```

## コンソールから Lambda Layer の確認
