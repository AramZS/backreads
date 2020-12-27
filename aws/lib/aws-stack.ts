import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3'
import * as ssm from '@aws-cdk/aws-ssm'
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const pinboardBucket = new s3.Bucket(this, 'PinboardLinks')
    const storyBucket = new s3.Bucket(this, 'StoryLinks')
    // defines an AWS Lambda resource
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas'),  // code loaded from "lambda" directory
      handler: 'hello.handler'                // file is "hello", function is "handler"
    });

    const secretPinboardFeed = ssm.StringParameter.fromStringParameterAttributes(this, 'MySecureValue', {
      parameterName: '/backreads/pinboardkey'
    });    

    const pinboardPull = new lambda.Function(this, 'PinboardPull', {
      runtime: lambda.Runtime.NODEJS_10_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/pinboard-pull'),  // code loaded from "lambda" directory
      handler: 'pinboard-pull.handler', // file is "hello", function is "handler"
      environment: {
        DEPOSIT_BUCKET: pinboardBucket.bucketName,
        FEED_NAME: secretPinboardFeed.stringValue
      }
    });

    const pinboardStoryLinks = new lambda.Function(this, 'PinboardStoryLinks', {
      runtime: lambda.Runtime.PYTHON_3_7,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/items-to-link-obj'),  // code loaded from "lambda" directory
      handler: 'items-to-link-obj.handler', // file is "hello", function is "handler"
      timeout: cdk.Duration.seconds(10),
      environment: {
        PICKUP_BUCKET: pinboardBucket.bucketName,
        FEED_NAME: 'feed.json',
        DEPOSIT_BUCKET: storyBucket.bucketName
      }
    });
    /**
    const rssToJsonPull = new lambda.Function(this, 'RssToJsonPull', {
      runtime: lambda.Runtime.PYTHON_3_7,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/rss-to-json'),  // code loaded from "lambda" directory
      handler: 'rss-to-json.handler', // file is "hello", function is "handler"
      environment: {
        DEPOSIT_BUCKET: pinboardBucket.bucketName,
        FEED_NAME: 'https://feeds.pinboard.in/rss/secret:7651932a7e7c6db975ea/u:AramZS/'
      }
    });
     */

    pinboardBucket.grantReadWrite(pinboardPull)
    pinboardBucket.grantReadWrite(pinboardStoryLinks)
    storyBucket.grantReadWrite(pinboardStoryLinks)

    const pullPinboardTask = new tasks.LambdaInvoke(this, 'Get Pinboard Feed', {
      lambdaFunction: pinboardPull,
      outputPath: '$'
    })

    const processLinksTask = new tasks.LambdaInvoke(this, 'Process Pinboard Feed', {
      lambdaFunction: pinboardStoryLinks,
      // inputPath: '$.guid',
      outputPath: '$'
    })

    const jobFailed = new sfn.Fail(this, 'Job Failed', {
      cause: 'AWS Batch Job Failed',
      error: 'DescribeJob returned FAILED',
    });

    const jobResolution = new sfn.Succeed(this, 'Job Succeeded', {});

    const definition = pullPinboardTask
      .next(processLinksTask)
      .next(new sfn.Choice(this, 'Job Complete?')
          // Look at the "status" field
          .when(sfn.Condition.numberGreaterThanEquals('$.StatusCode', 400), jobFailed)
          .when(sfn.Condition.numberEquals('$.StatusCode', 200), jobResolution));
          // .otherwise(waitX));

    new sfn.StateMachine(this, 'StateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5)
    });

  }
}