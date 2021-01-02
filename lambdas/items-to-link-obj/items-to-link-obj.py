
import json
import boto3
import os
import hashlib

s3 = boto3.resource('s3')

pickup_bucket = os.environ.get('PICKUP_BUCKET')
dropoff_bucket = os.environ.get('DEPOSIT_BUCKET')
feed_file = os.environ.get('FEED_NAME')


def pick_up_feed(pickup, file):
    feed_object = s3.Object(pickup, file)
    feed_data = json.loads(feed_object.get()['Body'].read().decode('utf-8'))
    return feed_data


def process_feed(feed_data):
    item_links = []
    item_objs = []
    for num, feed_data_item in enumerate(feed_data):
        print(feed_data_item['source'])
        hash_object = hashlib.md5(feed_data_item['source'].encode())
        feed_data_item['hash'] = hash_object.hexdigest()
        feed_data_item['weight'] = 1
        item_objs.append(feed_data_item)
        item_links.append(feed_data_item['source'])
    return item_objs


def create_link_files(bucket, link_set):
    for feed_data_item in link_set:
        s3.Object(bucket, 'item/'+feed_data_item['hash']+'.json').put(
            Body=json.dumps(feed_data_item, indent=4, sort_keys=True, default=str))

    return True


def handler(event=None, context=None):
    feed_data = pick_up_feed(pickup_bucket, feed_file)
    processed_data = process_feed(feed_data)
    return create_link_files(dropoff_bucket, processed_data)


if __name__ == "__main__":
    feed = pick_up_feed(
        'backreads-pinboardlinks365067f9-uqf5fmwd9km7', 'feed.json')
    print(feed)
    with open('../pinboard-pull/__test__/sampleJSON.json') as f:
        data = json.load(f)

        feed_links = process_feed(data)
        # print(feed_links)
        # print(data)
