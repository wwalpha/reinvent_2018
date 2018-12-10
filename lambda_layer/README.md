# Lambda Layer
AWS re:Invent 2018にて AWS Lambda Layers が発表されました。

今まで複数の Lambda ファンクションから呼び出すライブラリがあっても各ファンクションごとにパッケージングする必要がありました。

今回発表された AWS Lambda Layers を利用することで共通モジュール / 共通処理を Layer 化して複数の Lambda ファンクションから利用することができるようです。

## Lambda Layer の制限
* 最大同時５つ Layers 使える
  * A function can use up to 5 layers at a time
* Function と 全ての Layers、解凍後、250MB超えないこと
  * The total unzipped size of the function and all layers can't exceed the unzipped deployment package size limit of 250 MB.

## 事前準備
* Node.js
* aws cli
* TypeScript (npm -g install typescript)

## Exampleの流れ
* Layer 用共通ライブラリの作成 (src/library/utils.ts)
* Layer 用外部ライブラリの構成 (nodejs)
* テストコード作成 (src/lambda/app.ts)
* リリースモジュール作成
* 成果物の構成

### Layer 用共通ライブラリの作成
コンソールにメッセージ出力のファンクションを作成する

```js
export const test = () => console.log('Lambda Layer Test.');
```

### Layer 用外部ライブラリの構成
nodejsフォルダにて、`moment`ライブラリをインストールする

コマンドは`package.json`に設定済みなので、下記コマンドで実行します。

```sh
npm run initial
```

### テストコードの作成
Layer のライブラリを呼び出し、コンソールに出力する

```js
import * as utils from 'library/utils';
import * as moment from 'moment';

export const handler = (event: any, context: any, callback: any) => {
  console.log(utils.test());
  console.log(moment.now());

  callback(null, null);
};
```

### リリースモジュール作成
`package.json`のscriptで管理しているタスクを実行する

```
npm run release
```

### 成果物の構成
* dist/function.zip (Function Source)
* dist/nodejs.zip (Layer Source)

## Lambdaの実行確認
テスト環境の構築は、`CloudFormation`のテンプレートを用意しました。簡単に再現できます。

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
