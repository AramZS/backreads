import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { SnsEventSource, SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as lambdaDestinations from '@aws-cdk/aws-lambda-destinations';
import * as s3 from '@aws-cdk/aws-s3'
import * as s3Deployment from '@aws-cdk/aws-s3-deployment'
import * as ssm from '@aws-cdk/aws-ssm'
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { SfnStateMachine } from '@aws-cdk/aws-events-targets';
import * as route53 from '@aws-cdk/aws-route53'
import targets = require('@aws-cdk/aws-route53-targets/lib');
import * as route53Patterns from '@aws-cdk/aws-route53-patterns';
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import { DnsValidatedCertificate, ValidationMethod, CertificateValidation } from "@aws-cdk/aws-certificatemanager";
import * as ses from '@aws-cdk/aws-ses'
import * as sesActions from '@aws-cdk/aws-ses-actions'
import * as cr from '@aws-cdk/custom-resources';
import { SPADeploy } from 'cdk-spa-deploy'
import * as sns from '@aws-cdk/aws-sns';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as sqs from '@aws-cdk/aws-sqs';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import { PolicyStatement } from '@aws-cdk/aws-iam';


// https://github.com/aws/aws-cdk/issues/11127
const createFifoTopic = (stack: cdk.Stack, name: string) => {
  if (!name.endsWith('.fifo')) name = name + '.fifo';
  const topic = new sns.Topic(stack, name, {
    topicName: name,
    displayName: name
  });
  
  const cfnTopic = topic.node.defaultChild as sns.CfnTopic
  cfnTopic.addPropertyOverride("FifoTopic", true);
  cfnTopic.addPropertyOverride("ContentBasedDeduplication", false);
  return topic;
}

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Adapted from https://bahr.dev/2020/09/01/multiple-frontends/
    const domain = 'backreads.com'

    const emailNewslettersTopic = new sns.Topic(this, 'emailNewslettersTopic');
    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/sns-examples-publishing-messages.html 
    /**
    const linksTopicOld = new sns.Topic(this, 'linksetForProcessing',{
      displayName: 'linksetForProcessing',
      topicName: 'linksetForProcessing.fifo',
    });
     */
    const linksTopic = createFifoTopic(this, 'linksetForProcessing')

    const linkProcessingQueue = new sqs.Queue(this, 'linkProcessingQueue', {
      queueName: 'linkProcessingQueue.fifo',
      fifo: true,
      visibilityTimeout: cdk.Duration.seconds(6*90)
      // deadLetterQueue: // define this with a new queue to deliver to S3
    })

    linksTopic.addSubscription(new subscriptions.SqsSubscription(linkProcessingQueue))

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: domain
    })

    new cdk.CfnOutput(this, 'Site', {value: 'https://'+domain})

    // The code that defines your stack goes here
    const sourceLinkBucket = new s3.Bucket(this, 'SourceLinks', {
      bucketName: 'source-links'
    })
    const textsBucket = new s3.Bucket(this, 'BackreadsTexts', {
      bucketName: 'texts-for-processing'
    })
    const storyBucket = new s3.Bucket(this, 'StoryLinks')

    // Since this code is open source I don't want to open the ability to be DDOSed by revealing the incoming processor email.
    const secretEmail = ssm.StringParameter.fromStringParameterAttributes(this, 'newsletterEmail', {
      parameterName: '/backreads/newsletteremail'
    });    

    const backreadsSiteBucket = new s3.Bucket(this, 'BackreadsSite', {
      bucketName: 'backreads',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html'
    })

    const bucketPolicy = new PolicyStatement();
    bucketPolicy.addAnyPrincipal();
    bucketPolicy.addActions('s3:GetObject');
    bucketPolicy.addResources(`${backreadsSiteBucket.bucketArn}/*`);
    backreadsSiteBucket.addToResourcePolicy(bucketPolicy);

    new cdk.CfnOutput(this, 'Bucket', { value: backreadsSiteBucket.bucketName })
    // Needed to set up the domain in SES Identity Management dashboard
    // For a possible CDK way to do it - https://developer.aliyun.com/mirror/npm/package/@aws-cdk/custom-resources 
    const emailReceivingRuleset = new ses.ReceiptRuleSet(this, 'RuleSet', {
      rules: [
        {
          recipients: [`${secretEmail.stringValue}@${domain}`],
          actions: [
            new sesActions.AddHeader({
              name: 'X-Special-Header',
              value: 'aws'
            }),
            new sesActions.S3({
              bucket: textsBucket,
              objectKeyPrefix: 'emails/',
              topic: emailNewslettersTopic
            })
          ],
          enabled: true
        }
      ],
    });

    const accrueEmailData = new lambda.Function(this, 'accrueEmailData', {
      runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/accrue-email'),  // code loaded from "lambda" directory
      handler: 'accrue-email.handler',
      timeout: cdk.Duration.seconds(240),
      environment: {
        DEPOSIT_BUCKET: backreadsSiteBucket.bucketName,
        PICKUP_BUCKET: textsBucket.bucketName
      }
    });
    backreadsSiteBucket.grantReadWrite(accrueEmailData)
    storyBucket.grantReadWrite(accrueEmailData)
    textsBucket.grantReadWrite(accrueEmailData)

    const accrueLinksData = new lambda.Function(this, 'accrueDailyLinksData', {
      runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/accrue-daily-links'),  // code loaded from "lambda" directory
      handler: 'accrue-daily-links.handler',
      timeout: cdk.Duration.seconds(240),
      functionName: 'accrue-daily-links',
      environment: {
        DEPOSIT_BUCKET: backreadsSiteBucket.bucketName,
        PICKUP_BUCKET: storyBucket.bucketName
      }
    });
    backreadsSiteBucket.grantReadWrite(accrueLinksData)
    storyBucket.grantReadWrite(accrueLinksData)
    textsBucket.grantReadWrite(accrueLinksData)

    const emailToHtml = new lambda.Function(this, 'emailToHtml', {
      runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/html-from-email'),  // code loaded from "lambda" directory
      handler: 'html-from-email.handler',                // file is "hello", function is "handler"
      memorySize: 500,
      timeout: cdk.Duration.seconds(600),
      environment: {
        DEPOSIT_BUCKET: storyBucket.bucketName,
        LINKS_PROCESSING_TOPIC: linksTopic.topicArn
      }
      /** onSuccess: new lambdaDestinations.LambdaDestination(accrueEmailData, {
        responseOnly: true // auto-extract
      }) */
    });
    linksTopic.grantPublish(emailToHtml)
    storyBucket.grantReadWrite(emailToHtml)
    textsBucket.grantReadWrite(emailToHtml)
    emailToHtml.addEventSource(new SnsEventSource(emailNewslettersTopic))
    

    /**
    const activateSESRuleSet = new cr.AwsCustomResource(this, 'ActivateSESRuleSet', {
      onUpdate: {
        service: 'SES',
        action: 'SetActiveReceiptRuleSet',
        parameters: {
          RuleSetName: emailReceivingRuleset.receiptRuleSetName
        },
        physicalResourceId: cr.PhysicalResourceId.of(emailReceivingRuleset.receiptRuleSetName)
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE})
    });    
     */


    const certificate = new DnsValidatedCertificate(this, "SiteCertificate", {
      region: 'us-east-1',
      hostedZone: hostedZone,
      domainName: domain,
      subjectAlternativeNames: [`*.${domain}`],
      // validation: CertificateValidation.fromDns(),
      validationDomains: {
        [domain]: domain,
        [`*.${domain}`]: domain
      },
      validationMethod: ValidationMethod.DNS,
    })

    new cdk.CfnOutput(this, 'Certificate', 
      { value: certificate.certificateArn }
    );



    /**
    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      aliasConfiguration: {
          acmCertRef: certificate.certificateArn,
          names: [ domain ],
          sslMethod: cloudfront.SSLMethod.SNI,
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
          {
              customOriginSource: {
                  domainName: backreadsSiteBucket.bucketWebsiteDomainName,
                  originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
              },          
              behaviors : [ {isDefaultBehavior: true}],
          }
      ]
    });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });    

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: domain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });

    new HttpsRedirect(this, 'Redirect', {
      zone: hostedZone,
      recordNames: [`www.${domain}`],
      targetDomain: domain
    })
     */

    const getCFConfig = function(websiteBucket:s3.Bucket, config:any, accessIdentity: cloudfront.OriginAccessIdentity, cert?:DnsValidatedCertificate) {
      const cfConfig:any = {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
              originAccessIdentity: accessIdentity,
            },
            behaviors: config.cfBehaviors ? config.cfBehaviors : [{ isDefaultBehavior: true }],
          },
        ],
        // We need to redirect all unknown routes back to index.html for angular routing to work
        errorConfigurations: [{
          errorCode: 403,
          responsePagePath: (config.errorDoc ? `/${config.errorDoc}` : `/${config.indexDoc}`),
          responseCode: 200,
        },
        {
          errorCode: 404,
          responsePagePath: (config.errorDoc ? `/${config.errorDoc}` : `/${config.indexDoc}`),
          responseCode: 200,
        }],
      };

      if (typeof config.certificateARN !== 'undefined' && typeof config.cfAliases !== 'undefined') {
        cfConfig.aliasConfiguration = {
          acmCertRef: config.certificateARN,
          names: config.cfAliases,
        };
      }
      if (typeof config.sslMethod !== 'undefined') {
        cfConfig.aliasConfiguration.sslMethod = config.sslMethod;
      }

      if (typeof config.securityPolicy !== 'undefined') {
        cfConfig.aliasConfiguration.securityPolicy = config.securityPolicy;
      }

      if (typeof config.zoneName !== 'undefined' && typeof cert !== 'undefined') {
        cfConfig.viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(cert, {
          aliases: [config.zoneName],
        });
      }

      return cfConfig;
    }

    /**
    const deployment = new SPADeploy(this, 'spaDeployment').createSiteWithCloudfront({
      indexDoc: 'index.html',
      errorDoc: 'error.html',
      websiteFolder: '../static',
      certificateARN: certificate.certificateArn,
      cfAliases: [domain, `*.${domain}`]

    })
     */
    const accessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', { comment: `${backreadsSiteBucket.bucketName}-access-identity` });
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'cloudfrontDistribution', getCFConfig(backreadsSiteBucket, {
      indexDoc: 'index.html',
      errorDoc: 'error.html',
      websiteFolder: '../static',
      certificateARN: certificate.certificateArn,
      cfAliases: [domain, `*.${domain}`]   
    }, accessIdentity, certificate));

    const cloudfrontTarget = route53.RecordTarget
        .fromAlias(new targets.CloudFrontTarget(distribution));
    
    const siteHTMLDeployment = new s3Deployment.BucketDeployment(
      this,
      'deployStaticWebsite',
      {
          sources: [s3Deployment.Source.asset('../static', {exclude: ['*.css', '*.js']})],
          destinationBucket: backreadsSiteBucket,
          distribution: distribution,
          distributionPaths: [
            '/',
            '/about.html',
            '/index.html', 
            '/error.html',
          ],
          prune: false,
          contentType: "text/html",
          contentLanguage: "en",
          cacheControl: [s3Deployment.CacheControl.setPublic()],
      }
    );
    const siteCSSDeployment = new s3Deployment.BucketDeployment(
      this,
      'deployStaticWebsiteCSS',
      {
          sources: [s3Deployment.Source.asset('../static', {exclude: ['*.html', '*.js']}), s3Deployment.Source.asset('../static/emails', {exclude: ['*.html', '*.js']})],
          destinationBucket: backreadsSiteBucket,
          distribution: distribution,
          distributionPaths: [
            '/emails/style.css',
            '/base.css'
          ],
          prune: false,
          contentType: 'text/css',
          cacheControl: [s3Deployment.CacheControl.setPublic()],
      }
    );

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, 'ARecord', {
      recordName: domain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });

    new route53.ARecord(this, 'WildCardARecord', {
      recordName: `*.${domain}`,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });

    new route53Patterns.HttpsRedirect(this, 'redirectWWW', {
      zone: hostedZone,
      recordNames: [`www.${domain}`],
      targetDomain: domain
    })

    const assembleEmailWebpage = new lambda.Function(this, 'assemble-email-page', {
      runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/assemble-email-page'),  // code loaded from "lambda" directory
      handler: 'assemble-email-page.handler', 
      functionName: 'assemble-email-info-page',
      timeout: cdk.Duration.seconds(300),
      environment: {
        PICKUP_BUCKET: backreadsSiteBucket.bucketName,
        DEPOSIT_BUCKET: backreadsSiteBucket.bucketName,
        DISTRIBUTION_ID: distribution.distributionId
      }
      /** onSuccess: new lambdaDestinations.LambdaDestination(accrueEmailData, {
        responseOnly: true // auto-extract
      }) */
    });
    // Adapted from https://github.com/aws/aws-cdk/pull/12238/files 
    const distributionArn = `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`;
    assembleEmailWebpage.addToRolePolicy(
      new PolicyStatement({
        resources: [distributionArn],
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetDistribution*',
          'cloudfront:GetInvalidation',
          'cloudfront:ListInvalidations',
          'cloudfront:ListDistributions',
        ],
      })
    )
    backreadsSiteBucket.grantReadWrite(assembleEmailWebpage)
    
    /**
    // defines an AWS Lambda resource
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas'),  // code loaded from "lambda" directory
      handler: 'hello.handler'                // file is "hello", function is "handler"
    }); */

    const secretPinboardFeed = ssm.StringParameter.fromStringParameterAttributes(this, 'MySecureValue', {
      parameterName: '/backreads/pinboardkey'
    });
    
    const secretLoginEmail = ssm.StringParameter.fromStringParameterAttributes(this, 'LoginEmail', {
      parameterName: '/backreads/loginemail'
    });    
    
    const secretReadupPassword = ssm.StringParameter.fromStringParameterAttributes(this, 'ReadupPassword', {
      parameterName: '/backreads/readuppassword'
    });        

    const pinboardPull = new lambda.Function(this, 'PinboardPull', {
      runtime: lambda.Runtime.NODEJS_10_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/pinboard-pull'),  // code loaded from "lambda" directory
      handler: 'pinboard-pull.handler', // file is "hello", function is "handler"
      environment: {
        DEPOSIT_BUCKET: sourceLinkBucket.bucketName,
        FEED_NAME: secretPinboardFeed.stringValue
      }
    });

    const readupPull = new lambda.Function(this, 'ReadupPull', {
      runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/readup-pull'),  // code loaded from "lambda" directory
      handler: 'readup-pull.handler', // file is "hello", function is "handler"
      functionName: 'ReadupPull',
      timeout: cdk.Duration.seconds(300),
      environment: {
        DEPOSIT_BUCKET: sourceLinkBucket.bucketName,
        USERNAME: secretLoginEmail.stringValue,
        PASSWORD: secretReadupPassword.stringValue
      }
    });

    const createLinkObjs = new lambda.Function(this, 'BuldLinkObj', {
      runtime: lambda.Runtime.PYTHON_3_7,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/items-to-link-obj'),  // code loaded from "lambda" directory
      handler: 'items-to-link-obj.handler', // file is "hello", function is "handler"
      timeout: cdk.Duration.seconds(90),
      environment: {
        PICKUP_BUCKET: sourceLinkBucket.bucketName,
        FEED_NAME: 'pinboard/feed.json',
        DEPOSIT_BUCKET: storyBucket.bucketName
      }
    });
    createLinkObjs.addEventSource(new SqsEventSource(linkProcessingQueue));
    /**
    const rssToJsonPull = new lambda.Function(this, 'RssToJsonPull', {
      runtime: lambda.Runtime.PYTHON_3_7,    // execution environment
      code: lambda.Code.fromAsset('../lambdas/rss-to-json'),  // code loaded from "lambda" directory
      handler: 'rss-to-json.handler', // file is "hello", function is "handler"
      environment: {
        DEPOSIT_BUCKET: sourceLinkBucket.bucketName,
        FEED_NAME: 'https://feeds.pinboard.in/rss/secret:7651932a7e7c6db975ea/u:AramZS/'
      }
    });
     */
    sourceLinkBucket.grantReadWrite(readupPull)
    sourceLinkBucket.grantReadWrite(pinboardPull)
    sourceLinkBucket.grantReadWrite(createLinkObjs)
    storyBucket.grantReadWrite(createLinkObjs)
    textsBucket.grantReadWrite(createLinkObjs)

    const pullPinboardTask = new tasks.LambdaInvoke(this, 'Get Pinboard Feed', {
      lambdaFunction: pinboardPull,
      outputPath: '$.Payload.uploadedFeed'
    })

    const pullReadupTask = new tasks.LambdaInvoke(this, 'Get Readup Feed', {
      lambdaFunction: readupPull,
      outputPath: '$.Payload.uploadedFeed'
    })

    const processLinksTask = new tasks.LambdaInvoke(this, 'Process Pinboard Feed', {
      lambdaFunction: createLinkObjs,
      inputPath: '$',
      outputPath: '$'
    })

    const processReadupTask = new tasks.LambdaInvoke(this, 'Process Readup Feed', {
      lambdaFunction: createLinkObjs,
      inputPath: '$',
      outputPath: '$'
    })

    const collectEmailLinksTask = new tasks.LambdaInvoke(this, 'Process Email links into daily summary', {
      lambdaFunction: accrueEmailData,
      inputPath: '$',
      outputPath: '$'
    })

    const buildEmailPagesTask = new tasks.LambdaInvoke(this, 'Take email summary and build webpage', {
      lambdaFunction: assembleEmailWebpage,
      inputPath: '$',
      outputPath: '$'
    })
    // .Payload.resolved
    const collectDailyLinksTask = new tasks.LambdaInvoke(this, 'Process daily links into daily summary', {
      lambdaFunction: accrueLinksData,
      inputPath: '$',
      outputPath: '$'
    })

    const jobFailed = new sfn.Fail(this, 'Job Failed', {
      cause: 'AWS Batch Job Failed',
      error: 'DescribeJob returned FAILED',
    });

    const jobResolution = new sfn.Succeed(this, 'Job Succeeded', {});

    const start = new sfn.Pass(this, 'Start state', {
      result: sfn.Result.fromObject({ lastUpdatedDate: new Date(), version: 1 }),
      resultPath: '$.subObject',
    });


    const parallelSourceSitesCollection = new sfn.Parallel(this, 'CollectSourcesFromSites')
    const parallelSiteBuild = new sfn.Parallel(this, 'DailySiteBuild')

    const buildEmailSite = collectEmailLinksTask.next(buildEmailPagesTask)
    const buildIndexSite = collectDailyLinksTask
    const buildPinboardSource = pullPinboardTask
    const buildReadupSource = pullReadupTask

    const processSiteSources = new sfn.Map(this, 'ProcessSiteSources', {
      inputPath: '$',
      outputPath: '$',
    })

    processSiteSources.iterator(processLinksTask)

    const definition = start
      .next(parallelSourceSitesCollection
        .branch(buildPinboardSource) 
        .branch(buildReadupSource) 
      )
      .next(processSiteSources)
      .next(parallelSiteBuild
        .branch(buildEmailSite)
        .branch(buildIndexSite)
      )
      .next(new sfn.Choice(this, 'Job Complete?')
          // Look at the "status" field
          .when(sfn.Condition.numberGreaterThanEquals('$[0].StatusCode', 400), jobFailed)
          .when(sfn.Condition.numberGreaterThanEquals('$[1].StatusCode', 400), jobFailed)
          .when(sfn.Condition.numberEquals('$[0].StatusCode', 200), jobResolution)
          .when(sfn.Condition.numberEquals('$[1].StatusCode', 200), jobResolution)
      );
          // .otherwise(waitX));

    const linkBuilderStateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5)
    });

    // Don't forget the scheduled time is UTC
    const dailyLinkPull = new Rule(this, 'ScheduleRule', {
      // 4am et
      schedule: Schedule.cron({ minute: '00', hour: '09', }),
      targets: [new SfnStateMachine(linkBuilderStateMachine)]
     });

     // dailyLinkPull.addTarget()

  }
}