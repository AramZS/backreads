
import json
import boto3
import os
import hashlib
from datetime import date
from datetime import timedelta

s3 = boto3.resource('s3')

pickup_bucket = os.environ.get('PICKUP_BUCKET')
dropoff_bucket = os.environ.get('DEPOSIT_BUCKET')
feed_file = os.environ.get('FEED_NAME')


def pick_up_feed(pickup, file):
    feed_object = s3.Object(pickup, file)
    feed_data = json.loads(feed_object.get()['Body'].read().decode('utf-8'))
    return feed_data


def yesterday():
    # Get today's date
    today = date.today()
    print("Today is: ", today)

    # Yesterday date
    yesterday = today - timedelta(days=1)
    print("Yesterday was: ", yesterday)
    return yesterday


def process_feed(feed_data):
    item_links = []
    item_objs = []
    for num, feed_data_item in enumerate(feed_data):
        # print(feed_data_item['source'])
        hash_object = hashlib.md5(feed_data_item['source'].encode())
        feed_data_item['hash'] = hash_object.hexdigest()
        feed_data_item['weight'] = 1
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
        json_data['weight'] = json_data['weight']+1
        # print('append old link with new data')
        # print(json_data['weight'])
        return json_data
    except Exception as e:
        s3.Object(bucket, 'item/'+item_data['hash']+'.json').put(
            Body=json.dumps(item_data, indent=4, sort_keys=True, default=str))
        print('upload new link')
        return item_data


def create_link_files(bucket, link_set):
    for feed_data_item in link_set:
        final_feed_data_item = create_updated_link_object(
            bucket, feed_data_item)
        s3.Object(bucket, 'dailyLinks/'+yesterday()+'/'+feed_data_item['hash']+'.json').put(
            Body=json.dumps(feed_data_item, indent=4, sort_keys=True, default=str))

    return True


def handler(event=None, context=None):
    feed_data = pick_up_feed(pickup_bucket, feed_file)
    processed_data = process_feed(feed_data)
    return create_link_files(dropoff_bucket, processed_data)


if __name__ == "__main__":
    feed = pick_up_feed(
        'backreads-pinboardlinks365067f9-uqf5fmwd9km7', 'feed.json')
    # print(feed)
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
    print(finished_object)
    with open('../pinboard-pull/__test__/sampleJSON.json') as f:
        data = json.load(f)

        feed_links = process_feed(data)
        # print(feed_links)
        # print(data)
