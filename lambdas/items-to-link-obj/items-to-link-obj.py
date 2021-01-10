
import json
import boto3
import os
import hashlib
from datetime import date
from datetime import timedelta

s3 = boto3.resource('s3')

dropoff_bucket = os.environ.get('DEPOSIT_BUCKET')


def pick_up_feed(pickup, file):
    feed_object = s3.Object(pickup, file)
    print('Feed Object Found')
    feed_data = json.loads(feed_object.get()['Body'].read().decode('utf-8'))
    return feed_data


def yesterday():
    # Get today's date
    today = date.today()
    print("Today is: ", today)

    # Yesterday date
    yesterday = today - timedelta(days=1)
    print("Yesterday was: ", yesterday)
    return yesterday.strftime('%Y-%m-%d')


def platformValue(x):
    return {
        'email': 1,
        'https://pinboard.in': 2,
        'https://twitter.com': 3,
        'https://instapaper.com': 5,
        'https://readup.com': 8
    }.get(x, 2)


def process_feed(feed_data):
    print('Process Feed')
    item_links = []
    item_objs = []
    if isinstance(feed_data, dict):
        linkset = feed_data['links']
    else:
        linkset = feed_data
    for num, feed_data_item in enumerate(linkset):
        # print(feed_data_item['source'])
        hash_object = hashlib.md5(feed_data_item['source'].encode())
        feed_data_item['hash'] = hash_object.hexdigest()
        if "platform" in feed_data_item:
            if "weight" in feed_data_item:
                # Weight is already assigned
                feed_data_item['weight'] = feed_data_item['weight']
            else:
                feed_data_item['weight'] = platformValue(
                    feed_data_item['platform'])
        else:
            feed_data_item['weight'] = 2
            feed_data_item['platform'] = 'https://pinboard.in'

        feed_data_item['platformsSeenOn'] = [feed_data_item['platform']]
        item_objs.append(feed_data_item)
        item_links.append(feed_data_item['source'])
    return item_objs


def create_updated_link_object(bucket, item_data):
    final_feed_data_item = {}
    try:
        linkS3Obj = s3.Object(
            bucket, 'item/'+item_data['hash']+'.json')
        linkS3Obj.load()
        data = linkS3Obj.get()['Body'].read().decode('utf-8')
        json_data = json.loads(data)
        # print(json_data)
        # Change depending on input
        #   Pinboard weight: 2
        # json_data['weight'] = json_data['weight']+2
        if (len(item_data['description']) > len(json_data['description'])):
            json_data['description'] = item_data['description']

        if (item_data['platform'] == 'email' or item_data['platform'] != json_data['platform']):
            json_data['weight'] = json_data['weight'] + \
                platformValue(item_data['platform'])

            if 'platformsSeenOn' in json_data or (item_data['platform'] == 'email' and 'email' not in json_data['platformsSeenOn']):
                json_data['platformsSeenOn'].append(item_data['platform'])
            else:
                json_data['platformsSeenOn'] = [
                    item_data['platform'], json_data['platform']]

            # print('append old link with new data')
            # print(json_data['weight'])
        print('update link')
        s3.Object(bucket, 'item/'+json_data['hash']+'.json').put(
            Body=json.dumps(json_data, indent=4, sort_keys=True, default=str))
        return json_data
    except Exception as e:
        s3.Object(bucket, 'item/'+item_data['hash']+'.json').put(
            Body=json.dumps(item_data, indent=4, sort_keys=True, default=str))
        print('upload new link')
        return item_data


def create_link_files(bucket, link_set):
    yesterdayString = yesterday()
    linkPrefix = 'dailyLinks/'+yesterdayString
    print('target for upload')
    print(bucket)
    print(link_set)
    resultItems = []
    for feed_data_item in link_set:
        # print('processing feed item')
        # print(feed_data_item)
        final_feed_data_item = create_updated_link_object(
            bucket, feed_data_item)
        resultItems.append(s3.Object(bucket, linkPrefix+'/'+feed_data_item['hash']+'.json').put(
            Body=json.dumps(final_feed_data_item, indent=4, sort_keys=True, default=str)))

    print('All links processed')
    return resultItems


def handler(event=None, context=None):
    print('Event: ')
    print(event)
    uploadBucket = ''
    uploadKey = ''
    # https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
    if 'Records' in event and 'body' in event['Records'][0]:
        feedToProcess = json.loads(event['Records'][0]['body'])
        print(feedToProcess)
        feedMessage = json.loads(feedToProcess['Message'])
        print(feedMessage)
        uploadBucket = feedMessage['uploadBucket']
        uploadKey = feedMessage['uploadKey']
    else:
        uploadBucket = event['uploadBucket']
        uploadKey = event['uploadKey']

    print('Download Params')
    print(uploadBucket)
    print(uploadKey)
    try:
        feed_data = pick_up_feed(uploadBucket, uploadKey)
        print('Picked up data from:')
        print(uploadBucket)
        print(uploadKey)
        processed_data = process_feed(feed_data)
        return create_link_files(dropoff_bucket, processed_data)
    except Exception as e:
        print('could not pick up feed')
        print(e)
        return False


if __name__ == "__main__":
    boto3.session.Session(aws_access_key_id=os.environ.get(
        'AWS_ACCESS_KEY_ID'), aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'), profile_name="aram")
    feed = pick_up_feed(
        'backreads-pinboardlinks365067f9-uqf5fmwd9km7', 'feed.json')
    print("Main")
    day = yesterday()
    print(day)
    sampleLink = {
        "date": "2021-01-02T09:39:50.790Z",
        "hash": "2a6ed1aa55a215d5514d8ec423e01da9",
        "weight": 1,
        "description": "The Baker administration said the law will supplement measures included in the new state budget that require Massachusetts insurers to use a standard credentialing form, and prohibit additional costs for same-day billing for multiple primary care and behavioral health visits.",
        "platform": "email",
        "source": "https://www.bostonglobe.com/2021/01/01/metro/baker-signs-new-health-care-law-covering-telehealth-other-services/",
        "tags": [],
        "title": "Baker signs new health care law covering telehealth, other services into effect - The Boston Globe"
    }
    finished_object = create_updated_link_object(
        "backreads-storylinksf7459473-1mas6jxy3j45q", sampleLink)
    # print(finished_object)
    yesterdayString = yesterday()
    linkPrefix = 'dailyLinks/'+yesterdayString
    # print(linkPrefix)
    sampleInput = {
        "uploadResult": {
            "ETag": "\"024865a178d301fed70de10ef7a63c34\"",
            "Location": "https://source-links.s3.amazonaws.com/pinboard/feed.json",
            "key": "pinboard/feed.json",
            "Key": "pinboard/feed.json",
            "Bucket": "source-links"
        },
        "uploadBucket": "source-links",
        "uploadKey": "pinboard/feed.json"
    }
    dropoff_bucket = 'backreads-storylinksf7459473-1mas6jxy3j45q'
    # handler(sampleInput, False)

    sampleQueueInput = {
        "Records": [{
            "messageId": "ad896612-b4b3-4ba8-af63-c506a9a4b0d7",
            "receiptHandle": "AQEB79LecnXB+FfF2Kd2JK6mOkVtEywJmBEcqRhtbYkbWiezFJu3R56SgKtVBOb6gZX+HotCa+g6c8F58keU5+E0DW/nb1kiikrJe6o8VmcY7ZWzpdBq6HJ7pAev5eyZ0M2NxNw9Ug7qHfE/R0spD9ctVFzjwY4r3bHBhft7/KD3BQsalCiYDJsU0fMAP38e2XJbFGeYl0eIksZpsBWMcyqsKlJmKNbkizLalw7Gmx7LYi58ycjcsve3dQzDWkPPCoMUWLy73gGoif3GnKNVMRfUHWA04x4ZEJWFVzNVn6QTdZM=",
            "body": "{\n  \"Type\" : \"Notification\",\n  \"MessageId\" : \"ec7a4369-3eaf-5606-9a26-1b1c7c9a63a5\",\n  \"SequenceNumber\" : \"10000000000000000003\",\n  \"TopicArn\" : \"arn:aws:sns:us-east-1:478108726520:linksetForProcessing.fifo\",\n  \"Message\" : \"{\\\"uploadBucket\\\":\\\"texts-for-processing\\\",\\\"uploadKey\\\":\\\"emails-links/2021-01-10/27guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1.json\\\"}\",\n  \"Timestamp\" : \"2021-01-10T17:57:09.883Z\",\n  \"UnsubscribeURL\" : \"https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:478108726520:linksetForProcessing.fifo:b4430595-ff81-457d-8c04-96800fa2395f\"\n}",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1610301430169",
                "SequenceNumber": "18858981239832818688",
                "MessageGroupId": "JOB2021-01-1027guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1",
                "SenderId": "AIDAYRRVD2ENU4DSO2WBX",
                "MessageDeduplicationId": "2021-01-1027guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1",
                "ApproximateFirstReceiveTimestamp": "1610301430169"
            },
            "messageAttributes": {

            },
            "md5OfBody": "bd72f91ad9d1d38af524e62c2891f983",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:478108726520:linkProcessingQueue.fifo",
            "awsRegion": "us-east-1"
        }]
    }
    handler(sampleQueueInput, False)
    with open('../pinboard-pull/__test__/sampleJSON.json') as f:
        data = json.load(f)

        feed_links = process_feed(data)
        # print(feed_links)
        # print(data)
