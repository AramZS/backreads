const tools = require('../parsing-tools')
const fs = require('fs')
const path = require('path');
// const simpleParser = require('mailparser').simpleParser;
var MailParser = require("mailparser-mit").MailParser;
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fetch = require('node-fetch');

/** const metascraper = require('metascraper')([
	require('metascraper-url')(),
	require('metascraper-title')(),
  ]) */
describe('feed tools', () => {
	let file
	beforeAll(async (done) => {
/**
			const response = await fetch('https://feeds.pinboard.in/rss/secret:7651932a7e7c6db975ea/u:AramZS/')
			fs.writeFileSync(path.join(__dirname, 'sampleFeed.xml'), await response.text())
 */
		const fileBuffer = fs.readFileSync(path.join(__dirname, 'sampleEmail'));
		file = fileBuffer.toString();
		done()
	  });
	  it('should parse an email', async (done) => {
		expect.assertions(4)
		var mailparser = new MailParser();
		mailparser.on("end", function(mail_object){
			// console.log(mail_object.html)
			expect(mail_object.subject).toBe('Weekly Newsletter: Subscription Confirmed')
			expect(mail_object.html).toBeDefined();
			var dom = new JSDOM(mail_object.html)
			expect(dom.window.document.querySelector('a.formEmailButton')).toBeDefined()
			var link = dom.window.document.querySelector('a.formEmailButton').href
			expect(link).toMatch("us13.mailchimp.com/mctx/clicks")
			done()
		});
		 
		// send the email source to the parser
		mailparser.write(file);
		mailparser.end();

		/**simpleParser(file, null, (err, parsed) => {
			expect(parsed.headers.get('subject')).toBe('Weekly Newsletter: Subscription Confirmed')
			expect(parsed.html).toBeDefined()
			var dom = new JSDOM(parsed.html)
			expect(dom.window.document.querySelector('a.formEmailButton')).toBeDefined()
			var link = dom.window.document.querySelector('a.formEmailButton').href
			expect(link).toMatch("us13.mailchimp.com/mctx/clicks")
			done()
		}); */

	  })
	  it('should parse a record event', () => {
		let event = {
			"Records": [
				{
					"EventSource": "aws:sns",
					"EventVersion": "1.0",
					"EventSubscriptionArn": "arn:aws:sns:us-east-1:478108726520:BackReads-emailNewslettersTopic8B744BF6-WKQKEKXWSM40:97838fdd-3118-4d86-b903-5ea7b16affef",
					"Sns": {
						"Type": "Notification",
						"MessageId": "0d90cf49-628c-5a1a-a00b-97216a7a942e",
						"TopicArn": "arn:aws:sns:us-east-1:478108726520:BackReads-emailNewslettersTopic8B744BF6-WKQKEKXWSM40",
						"Subject": "Amazon SES Email Receipt Notification",
						"Message": "{\"notificationType\":\"Received\",\"mail\":{\"timestamp\":\"2020-12-31T17:13:25.742Z\",\"source\":\"azs.gmu+caf_=givemeyournewsletter=backreads.com@gmail.com\",\"messageId\":\"dse8s7jhc9eg90tmimg1q2scsc14gvjvbbom6n81\",\"destination\":[\"givemeyournewsletter@aramzs.me\"],\"headersTruncated\":false,\"headers\":[{\"name\":\"Return-Path\",\"value\":\"<azs.gmu+caf_=givemeyournewsletter=backreads.com@gmail.com>\"},{\"name\":\"Received\",\"value\":\"from mail-ot1-f45.google.com (mail-ot1-f45.google.com [209.85.210.45]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id dse8s7jhc9eg90tmimg1q2scsc14gvjvbbom6n81 for givemeyournewsletter@backreads.com; Thu, 31 Dec 2020 17:13:25 +0000 (UTC)\"},{\"name\":\"Received-SPF\",\"value\":\"pass (spfCheck: domain of _spf.google.com designates 209.85.210.45 as permitted sender) client-ip=209.85.210.45; envelope-from=azs.gmu+caf_=givemeyournewsletter=backreads.com@gmail.com; helo=mail-ot1-f45.google.com;\"},{\"name\":\"Authentication-Results\",\"value\":\"amazonses.com; spf=pass (spfCheck: domain of _spf.google.com designates 209.85.210.45 as permitted sender) client-ip=209.85.210.45; envelope-from=azs.gmu+caf_=givemeyournewsletter=backreads.com@gmail.com; helo=mail-ot1-f45.google.com; dkim=pass header.i=@mg2.substack.com; dmarc=pass header.from=substack.com;\"},{\"name\":\"X-SES-RECEIPT\",\"value\":\"AEFBQUFBQUFBQUFFOERoRG90WTRaWFF1bitMR2tucHRXTG8rbVpRS3Zaei9QVTNUY0tBd0J0Sk1HbmxtemJtQUNGck56MGtQWFhFeldHN2dZRTVsR09HckF2ZXpQL2lKV2hsanJMUS9lZjlzbU9tRDV6UjRUWnhoMlNXZmFDMm14c20zUlNWZjF5WE1jTXpCbWpUSnVKMjdlZkUxeWlDNS9QUExnWHVzb1Jja25JY2ovZUI5NmR5RGZpbzYwbTFDeExjNDJXeGw2VllMQ1l2Tzl4YXNsUm1BT0NMVkVieUtLa2JMT01FRVhBS0NxVWo1eVNNYjdmVm1lY2Jpbk1BUTJQVzhkN2d5UmRsTFFsc3hZQy9XM1N5YmtYY3NLZjdLNDZDUEVXcTFJTTBQT0Q1Qnl1dlI4Sm94ZytqdkJKMlhFUUkvaDltVTg5UVVZS1FVK2I1bFMwS1ZyZy9SU0FCRWVMTGlMZW5mV2l0MW9mWmFBbmk1OHJBPT0=\"},{\"name\":\"X-SES-DKIM-SIGNATURE\",\"value\":\"a=rsa-sha256; q=dns/txt; b=E/oQ0szIiTi9kbxWr1AxU2Cav0nzhxy9XLrdZjs5rCQ7w3lxiWMXY4+V14zt1QC6A3oJcMnySjkKHI3EjvoeP+7m1QF8mz8J64cIP04GTZ5m5nswbN4XbHAHIx4bWmIkuzVQJR/E1RRiqqPpsAhPNn/JU6ATDPkFRu1GOpe+gUM=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1609434806; v=1; bh=UixrtBXD9+Few+jE2dsXWHgsfV1sn/1S2/ojN3mDp4U=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;\"},{\"name\":\"Received\",\"value\":\"by mail-ot1-f45.google.com with SMTP id n42so18428909ota.12 for <givemeyournewsletter@backreads.com>; Thu, 31 Dec 2020 09:13:25 -0800 (PST)\"},{\"name\":\"X-Google-DKIM-Signature\",\"value\":\"v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20161025; h=x-gm-message-state:delivered-to:dkim-signature :list-unsubscribe-post:references:list-archive:list-url:list-owner :sender:list-unsubscribe:message-id:list-post:date:reply-to :in-reply-to:list-id:to:from:subject:mime-version; bh=u8IhMAUonfSJddne8QobLKJPEz3E02dO7UYQ9A5DsmU=; b=UZJTpvVtGJv4vUSW/thLvB+M0B/KK/oiVKMlTYw68sI2OikDR0EZ0dCnTaSoDpn/Yd DCdGOCnvVDftJJFI5RwEY+QAHu9cgvTHJw1SkmlCqYrsS0PGpBg9jJJ+8RmVi2xTV/oC u7jPGK23udqnp71fLDC+8R/fX1LIEg6ElLt2/GeGVCEXOTmWD2GkcOhHmCtcw85IFr4S bB71CfTBsOcVGzLvCTWNVR93jYfHasDX8LjAFp3T1BZWAWzP0ppZ82xQe2b5k0DCS6n8 FVMpPPzU/Pzqzds4+oM1mpooxmAlU5R4Fs1orUDMZjLYPDEaBgFzgGZrSBqi4cqetc1Z srsw==\"},{\"name\":\"X-Gm-Message-State\",\"value\":\"AOAM533fqoO1kpL+hx8e5+KmTnM3U4m8u3LJRy51t4rhGqgUSrsBI4BW 4IT+ryDEMrsrPLPhN+Sib5fxZmk1RppvMLmEm/AKqWKB45HUpfTXdA==\"},{\"name\":\"X-Received\",\"value\":\"by 2002:a05:6830:784:: with SMTP id w4mr42408296ots.53.1609434805081; Thu, 31 Dec 2020 09:13:25 -0800 (PST)\"},{\"name\":\"X-Forwarded-To\",\"value\":\"givemeyournewsletter@backreads.com\"},{\"name\":\"X-Forwarded-For\",\"value\":\"azs.gmu@gmail.com givemeyournewsletter@backreads.com\"},{\"name\":\"Delivered-To\",\"value\":\"azs.gmu@gmail.com\"},{\"name\":\"Received\",\"value\":\"by 2002:a9d:6c58:0:0:0:0:0 with SMTP id g24csp12206474otq; Thu, 31 Dec 2020 09:13:23 -0800 (PST)\"},{\"name\":\"X-Google-Smtp-Source\",\"value\":\"ABdhPJw9hs8c1e04d2dqQnRrwzfqr6VcPLAAl+ylJvLPNmY5jzoGpT49yr2olWinoSZeegBbM/0C\"},{\"name\":\"X-Received\",\"value\":\"by 2002:a9d:2270:: with SMTP id o103mr41638181ota.320.1609434803077; Thu, 31 Dec 2020 09:13:23 -0800 (PST)\"},{\"name\":\"ARC-Seal\",\"value\":\"i=1; a=rsa-sha256; t=1609434803; cv=none; d=google.com; s=arc-20160816; b=Skvhew6PoO34QQgHG9UcV/0p39ufEI4ZFjsbI0G42psHz8tWTw0c5bZSsxsUZlGRQX 9VPMX2fcXW9W2v4m+OGXSDOoon4UzYReBk1+GFKBiYBjv/YC/et86l6PuUC70JvElEEo 8WK3mRnAh9PuBoLPFPhAPqWxz2o9r+duc+wSK/rhGU72z5496S2sCimmkclww9+O3npa MFlxXDfdK7cdUantGgrupwsDUb0HUPA3plHwVB9lt2aVNc5GWtNLces5ti8gs2bAawh7 WhJNs1eJtSSM8g9geK6hLpTuzKB3aoNBbgc9ahCTK5Jz8l5ZuHgpDA5DkiA0RsmHf+iE kLwQ==\"},{\"name\":\"ARC-Message-Signature\",\"value\":\"i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816; h=mime-version:subject:from:to:list-id:in-reply-to:reply-to:date :list-post:message-id:list-unsubscribe:sender:list-owner:list-url :list-archive:references:list-unsubscribe-post:dkim-signature; bh=u8IhMAUonfSJddne8QobLKJPEz3E02dO7UYQ9A5DsmU=; b=Fd9OtbFZlg0ZlOqwSzcIST5L0qpjs/CaIlfJblOAbI8jlRkCzLNgtQBydxV888f3TB TXpEIVsWRzvEEHRfw1E6o4gv0gdCeHqogQQ2T2LoEMIDhygMUVPObFcnIGea3O33L5YY UZFOjbW2VPhTCqaQEVvu5XmsHonWyNtaE/cnCXmWA4AuZ9Ik0LjFKgcRERV0mhfsz9qQ Lo/7FHPK8C4SfI3ElGuJ0rNiku2tZ/KzS79Ncq5IYMm0YF94wwYGwZpaDG/UdnjNCyhM lIhfV0+/HPi+pFlrc6jtRa3JlxYRjEO7Pjo5MYqaremS9KDWIOa+pxl8YOoM72tI9cSC fVWA==\"},{\"name\":\"ARC-Authentication-Results\",\"value\":\"i=1; mx.google.com; dkim=pass header.i=@mg2.substack.com header.s=mailo header.b=KASB9b3J; spf=softfail (google.com: domain of transitioning bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com does not designate 192.185.45.133 as permitted sender) smtp.mailfrom=\\\"bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com\\\"; dmarc=pass (p=REJECT sp=NONE dis=NONE) header.from=substack.com\"},{\"name\":\"Return-Path\",\"value\":\"<bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com>\"},{\"name\":\"Received\",\"value\":\"from gateway21.websitewelcome.com (gateway21.websitewelcome.com. [192.185.45.133]) by mx.google.com with ESMTPS id f72si22251608oig.148.2020.12.31.09.13.22 for <azs.gmu@gmail.com> (version=TLS1_2 cipher=ECDHE-ECDSA-AES128-GCM-SHA256 bits=128/128); Thu, 31 Dec 2020 09:13:23 -0800 (PST)\"},{\"name\":\"Received-SPF\",\"value\":\"softfail (google.com: domain of transitioning bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com does not designate 192.185.45.133 as permitted sender) client-ip=192.185.45.133;\"},{\"name\":\"Authentication-Results\",\"value\":\"mx.google.com; dkim=pass header.i=@mg2.substack.com header.s=mailo header.b=KASB9b3J; spf=softfail (google.com: domain of transitioning bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com does not designate 192.185.45.133 as permitted sender) smtp.mailfrom=\\\"bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com\\\"; dmarc=pass (p=REJECT sp=NONE dis=NONE) header.from=substack.com\"},{\"name\":\"Received\",\"value\":\"from cm10.websitewelcome.com (cm10.websitewelcome.com [100.42.49.4]) by gateway21.websitewelcome.com (Postfix) with ESMTP id C88BB400E5F8C for <azs.gmu@gmail.com>; Thu, 31 Dec 2020 11:13:22 -0600 (CST)\"},{\"name\":\"Received\",\"value\":\"from box2279.bluehost.com ([50.87.192.171]) by cmsmtp with SMTP id v1Vqk0aEVuDoAv1VqkKLhh; Thu, 31 Dec 2020 11:13:22 -0600\"},{\"name\":\"X-Authority-Reason\",\"value\":\"s=1\"},{\"name\":\"Received\",\"value\":\"from mg-47-221.substack.com ([69.72.47.221]:41434) by box2279.bluehost.com with esmtps  (TLS1.2) tls TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 (Exim 4.93) (envelope-from <bounce+2546f8.4d1858-givemeyournewsletter=aramzs.me@mg2.substack.com>) id 1kv1Vo-003VwV-KW for givemeyournewsletter@aramzs.me; Thu, 31 Dec 2020 10:13:22 -0700\"},{\"name\":\"DKIM-Signature\",\"value\":\"a=rsa-sha256; v=1; c=relaxed/relaxed; d=mg2.substack.com; q=dns/txt; s=mailo; t=1609434801; h=Content-Type:Mime-Version:Subject:From:To:List-Id:In-Reply-To:Reply-To:Date:List-Post:Message-Id:List-Unsubscribe:Sender:List-Owner:List-Archive:References:List-Unsubscribe-Post; bh=u8IhMAUonfSJddne8QobLKJPEz3E02dO7UYQ9A5DsmU=; b=KASB9b3J5YprBxx4taU1/ptWYLlazA/xp92U/3w/lBCHKJOin9eWW9hsSHjbHSItr2jvpkNF3wG3MKdJnEtT+dZbohmwoYGw2QIn9NDsL0GBGEb+w9S0vo+qK+yXUF33jZCTePfHSZdAUsJciPRoRduy2a+AzeBGbfWpk/HFXzI=\"},{\"name\":\"X-Mailgun-Sending-Ip\",\"value\":\"69.72.47.221\"},{\"name\":\"X-Mailgun-Sid\",\"value\":\"WyIwNTk0NCIsICJnaXZlbWV5b3VybmV3c2xldHRlckBhcmFtenMubWUiLCAiNGQxODU4Il0=\"},{\"name\":\"X-Mailgun-Batch-Id\",\"value\":\"5fee068d1fb87508df2712ae\"},{\"name\":\"Received\",\"value\":\"by luna.mailgun.net with HTTP; Thu, 31 Dec 2020 17:12:44 +0000\"},{\"name\":\"X-Mailgun-Variables\",\"value\":\"{\\\"category\\\": \\\"post\\\", \\\"email_generated_at\\\": \\\"1609434763688\\\", \\\"is_freemail\\\": \\\"true\\\", \\\"publication_id\\\": \\\"25792\\\", \\\"post_audience\\\": \\\"everyone\\\", \\\"post_id\\\": \\\"30073205\\\", \\\"pub_community_enabled\\\": \\\"true\\\", \\\"user_id\\\": \\\"4361\\\", \\\"post_type\\\": \\\"newsletter\\\", \\\"subdomain\\\": \\\"peteryang\\\"}\"},{\"name\":\"List-Unsubscribe-Post\",\"value\":\"List-Unsubscribe=One-Click\"},{\"name\":\"References\",\"value\":\"<post-30073205@substack.com>\"},{\"name\":\"List-Archive\",\"value\":\"<https://peteryang.substack.com/archive>\"},{\"name\":\"List-Url\",\"value\":\"<https://peteryang.substack.com/>\"},{\"name\":\"List-Owner\",\"value\":\"<mailto:peteryang@substack.com>\"},{\"name\":\"Sender\",\"value\":\"\\\"Peter\\\" <peteryang@substack.com>\"},{\"name\":\"List-Unsubscribe\",\"value\":\"<https://peteryang.substack.com/action/disable_email/disable?podcast=&token=eyJ1c2VyX2lkIjo0MzYxLCJwb3N0X2lkIjozMDA3MzIwNSwiaWF0IjoxNjA5NDM0NzYzLCJpc3MiOiJwdWItMjU3OTIiLCJzdWIiOiJkaXNhYmxlX2VtYWlsIn0.783TP7xdZ0OzySQXaKotMT1xNFgNLd25443Di-VEw2k>\"},{\"name\":\"Message-Id\",\"value\":\"<20201231171243.1.nb8kra64dwq@mg2.substack.com>\"},{\"name\":\"List-Post\",\"value\":\"<https://peteryang.substack.com/p/how-to-self-publish-a-book>\"},{\"name\":\"Date\",\"value\":\"Thu, 31 Dec 2020 17:12:43 +0000\"},{\"name\":\"Reply-To\",\"value\":\"\\\"Peter\\\" <reply+hwkmt&3d5&&0a41e8dbd03c4f3c115a9560db75e02090bcf8cd8cb08b29288c1052c7bc400a@mg1.substack.com>\"},{\"name\":\"In-Reply-To\",\"value\":\"<post-30073205@substack.com>\"},{\"name\":\"List-Id\",\"value\":\"<peteryang.substack.com>\"},{\"name\":\"X-Mailgun-Tag\",\"value\":\"post\"},{\"name\":\"To\",\"value\":\"givemeyournewsletter@aramzs.me\"},{\"name\":\"From\",\"value\":\"Peter <peteryang@substack.com>\"},{\"name\":\"Subject\",\"value\":\"How I Self Published a Book that Sold 5,000 Copies\"},{\"name\":\"Mime-Version\",\"value\":\"1.0\"},{\"name\":\"Content-Type\",\"value\":\"multipart/alternative; boundary=\\\"82f732d2cc514d6db9d8a99874d1a5fb\\\"\"},{\"name\":\"X-AntiAbuse\",\"value\":\"This header was added to track abuse, please include it with any abuse report\"},{\"name\":\"X-AntiAbuse\",\"value\":\"Primary Hostname - box2279.bluehost.com\"},{\"name\":\"X-AntiAbuse\",\"value\":\"Original Domain - aramzs.me\"},{\"name\":\"X-AntiAbuse\",\"value\":\"Originator/Caller UID/GID - [47 12] / [47 12]\"},{\"name\":\"X-AntiAbuse\",\"value\":\"Sender Address Domain - mg2.substack.com\"},{\"name\":\"X-BWhitelist\",\"value\":\"no\"},{\"name\":\"X-Source-IP\",\"value\":\"69.72.47.221\"},{\"name\":\"X-Source-L\",\"value\":\"No\"},{\"name\":\"X-Exim-ID\",\"value\":\"1kv1Vo-003VwV-KW\"},{\"name\":\"X-Source\",\"value\":\"\"},{\"name\":\"X-Source-Args\",\"value\":\"\"},{\"name\":\"X-Source-Dir\",\"value\":\"\"},{\"name\":\"X-Source-Sender\",\"value\":\"mg-47-221.substack.com [69.72.47.221]:41434\"},{\"name\":\"X-Source-Auth\",\"value\":\"chronoto\"},{\"name\":\"X-Email-Count\",\"value\":\"8\"},{\"name\":\"X-Source-Cap\",\"value\":\"Y2hyb25vdG87Y2hyb25vdG87Ym94MjI3OS5ibHVlaG9zdC5jb20=\"},{\"name\":\"X-Local-Domain\",\"value\":\"no\"},{\"name\":\"X-Forwarder\",\"value\":\"box2279.bluehost.com\"},{\"name\":\"X-Special-Header\",\"value\":\"aws\"}],\"commonHeaders\":{\"returnPath\":\"azs.gmu+caf_=givemeyournewsletter=backreads.com@gmail.com\",\"from\":[\"Peter <peteryang@substack.com>\"],\"sender\":\"Peter <peteryang@substack.com>\",\"replyTo\":[\"Peter <reply+hwkmt&3d5&&0a41e8dbd03c4f3c115a9560db75e02090bcf8cd8cb08b29288c1052c7bc400a@mg1.substack.com>\"],\"date\":\"Thu, 31 Dec 2020 17:12:43 +0000\",\"to\":[\"givemeyournewsletter@aramzs.me\"],\"messageId\":\"<20201231171243.1.nb8kra64dwq@mg2.substack.com>\",\"subject\":\"How I Self Published a Book that Sold 5,000 Copies\"}},\"receipt\":{\"timestamp\":\"2020-12-31T17:13:25.742Z\",\"processingTimeMillis\":413,\"recipients\":[\"givemeyournewsletter@backreads.com\"],\"spamVerdict\":{\"status\":\"DISABLED\"},\"virusVerdict\":{\"status\":\"DISABLED\"},\"spfVerdict\":{\"status\":\"PASS\"},\"dkimVerdict\":{\"status\":\"GRAY\"},\"dmarcVerdict\":{\"status\":\"PASS\"},\"action\":{\"type\":\"S3\",\"topicArn\":\"arn:aws:sns:us-east-1:478108726520:BackReads-emailNewslettersTopic8B744BF6-WKQKEKXWSM40\",\"bucketName\":\"backreads-texts0ac1f062-1m32jvef6xbng\",\"objectKeyPrefix\":\"emails/\",\"objectKey\":\"emails/dse8s7jhc9eg90tmimg1q2scsc14gvjvbbom6n81\"}}}",
						"Timestamp": "2020-12-31T17:13:26.173Z",
						"SignatureVersion": "1",
						"Signature": "Vo/MarPQ4T0YG5R5iMzcqWod+/eNcTePi70kEW0O58oFsUqVbWaItz1rb/WAx2+hxGbN5hY2zDQM7GosPvKhJRITyYTPgnXR+92N3Qa0dzuJEFGt2FX1xq9AYLIiBRf2FKpwDph78F/VsT6+gogi3Pvm+qRVwEH/AAEGJzc5xsiO9KT25AIX5Td1XYQvzYSrurG8CL50oKryYia2I0GXnzJJ/DSN+qT4h9miRzJ8tQktgSIGJGQFx3KNHGgLTzMLEJ788BE4eh2wPwun2mK80PTn71y6K6Ko3UdVlm6yq9yUEo7iuCPaVxrU68bI3vhjJP3LM0MEPyi8XyUZHTMD/w==",
						"SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem",
						"UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:478108726520:BackReads-emailNewslettersTopic8B744BF6-WKQKEKXWSM40:97838fdd-3118-4d86-b903-5ea7b16affef",
						"MessageAttributes": {}
					}
				}
			]
		}
		expect(tools.parseDataFromRecord(event)).toBeDefined()
		expect(tools.parseDataFromRecord(event)).toHaveProperty('mail')
		expect(tools.parseDataFromRecord(event).mail).toHaveProperty('timestamp')
		expect(tools.parseDataFromRecord(event)).toHaveProperty('receipt')
		expect(tools.parseDataFromRecord(event).receipt).toHaveProperty('timestamp')
		expect(tools.parseDataFromRecord(event).receipt).toHaveProperty('action')
		expect(tools.parseDataFromRecord(event).receipt.action).toHaveProperty('bucketName')
		expect(tools.parseDataFromRecord(event).receipt.action).toHaveProperty('objectKey')
		expect(tools.parseDataFromRecord(event).receipt.action.bucketName).toBe('backreads-texts0ac1f062-1m32jvef6xbng')
		expect(tools.parseDataFromRecord(event).receipt.action.objectKey).toBe('emails/dse8s7jhc9eg90tmimg1q2scsc14gvjvbbom6n81')
		expect(tools.getBucketFromEmailEvent(tools.parseDataFromRecord(event))).toBe('backreads-texts0ac1f062-1m32jvef6xbng')
		expect(tools.getPathFromEmailEvent(tools.parseDataFromRecord(event))).toBe('emails/dse8s7jhc9eg90tmimg1q2scsc14gvjvbbom6n81')
	})
	it('should extract links from the email', async (done) => {
		expect.assertions(7)
		const fileBufferTwo = fs.readFileSync(path.join(__dirname, 'sampleEmail2'));
		fileTwo = fileBufferTwo.toString();
		var mailparser = new MailParser();
		mailparser.on("end", async function(parsed){
			expect(parsed.subject).toBe('A Teacher departs')
			expect(parsed.html).toBeDefined()
			const virtualConsole = new jsdom.VirtualConsole();
			// virtualConsole.on("error", () => { console.log(error) });
			// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
			var dom = new JSDOM(parsed.html, { pretendToBeVisual: false, virtualConsole })			
			var links = dom.window.document.querySelectorAll('a')
			expect(links.length).toBeGreaterThan(0)
			var linkset = tools.getLinksFromEmailHTML(parsed.html);
			expect(linkset).toBeDefined()
			expect(linkset).toHaveProperty('links')
			expect(linkset.links.length).toBeGreaterThan(0)
			expect(linkset.links[0]).toEqual('https://r.g-omedia.com/CL0/https:%2F%2Fwww.avclub.com%2F%3Futm_source=AV_Club_Daily_RSS%26utm_medium=email%26utm_campaign=2020-12-29/1/01000176b0c6b237-52ae3f4d-b45f-4491-b49e-ffa9e1f4ee43-000000/oe0UYLOzJhEL_T76EaNeZFgRGtpUkrUgUGqLu5zK4QE=173')
			done()
		});
		mailparser.write(fileTwo);
		mailparser.end();
	})
	it('should resolve dom', async (done) => {
		var link = "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9vcGVuLnNwb3RpZnkuY29tL3Nob3cvNW4xanJXYndoQnVLbkw2VE1pS3hKbj9zaT1DRnBPeEdIclNuaXVVWE1zN1BfbHNB/5756c6a26ce954a71a8b4d74B592858be"
		var r = await fetch(link, {redirect: 'follow'})
		let url = r.url
		let text = await r.text();
		const virtualConsole = new jsdom.VirtualConsole();
		// virtualConsole.on("error", () => { console.log(error) });
		// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
		var dom = new JSDOM(text, { pretendToBeVisual: false, virtualConsole })
		expect(dom).toBeDefined()
		expect(dom).toHaveProperty('window')
		expect(dom.window).toHaveProperty('document')
		expect(dom.window.document).toHaveProperty('querySelector')
		done()
	})
	it('should ignore irrelevant links', ()=>{
		expect(tools.collectableLink('https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9vcGVuLnNwb3RpZnkuY29tL3Nob3cvNW4xanJXYndoQnVLbkw2VE1pS3hKbj9zaT1DRnBPeEdIclNuaXVVWE1zN1BfbHNB/5756c6a26ce954a71a8b4d74B592858be')).toBe(true)
		expect(tools.collectableLink('https://hacktext.com')).toBe(false)
		expect(tools.collectableLink('https://facebook.com/aramzs')).toBe(false)
		expect(tools.collectableLink('https://twitter.com/chronotope')).toBe(false)
		expect(tools.collectableLink('https://tr.rev-stripe.com/stripe/redirect')).toBe(false)
		expect(tools.collectableLink('https://www.instagram.com/accounts/login/')).toBe(false)
		expect(tools.collectableLink('https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F0ff6f46d-4eb3-4b89-81b1-227e610a0f49_752x393.png')).toBe(false)
		expect(tools.collectableLink('https://some.substack.com/subscribe')).toBe(false)
		expect(tools.collectableLink('https://website.com/subscriptions')).toBe(false)
		expect(tools.collectableLink('https://website.com')).toBe(false)
		expect(tools.collectableLink('http://whatever.com/asdf')).toBe(true)
		expect(tools.collectableLink('http://whatever.com/asdf/')).toBe(true)
		expect(tools.collectableLink('http://whatever.com/')).toBe(false)
		expect(tools.collectableLink('https://substack.com/for-writers')).toBe(false)
		expect(tools.collectableLink('https://www.avclub.com/')).toBe(false)
		expect(tools.collectableLink('http://click1.newsletters.rollcall.com/ljzcmnyhflwrdhpsrdfgprshqgrwfpsqgfcwwnmmdhmdk_hfbcwmmbzvwvvbwvhfc.html?a=&b=01%2F22%2F2021')).toBe(true)
		expect(tools.collectableLink('https://nyc.us20.list-manage.com/track/click?u=73d98c6dfc90032198ec7bdee&id=07bc331363&e=e3dbec9412')).toBe(true)
		expect(tools.collectableLink('https://hbr.org')).toBe(false)
		expect(tools.collectableLink('https://www.mediapost.com/mediakit/')).toBe(false)
		expect(tools.collectableLink('https://discourseblog.com/subscribe/')).toBe(false)
		expect(tools.collectableLink('http://newsletters.wan-ifra.org/')).toBe(false)
	})
	it('should resolve links', async (done) => {
		expect.assertions(9)
		const fileBufferTwo = fs.readFileSync(path.join(__dirname, 'sampleEmail2'));
		fileTwo = fileBufferTwo.toString();
		var mailparser = new MailParser();
		mailparser.on("end", async function(parsed){
			expect(parsed.subject).toBe('A Teacher departs')
			expect(parsed.html).toBeDefined()
			var linkset = tools.getLinksFromEmailHTML(parsed.html);
			expect(linkset).toBeDefined()
			expect(linkset).toHaveProperty('links')
			expect(linkset.links.length).toBeGreaterThan(0)
			expect(linkset.links[0]).toEqual('https://r.g-omedia.com/CL0/https:%2F%2Fwww.avclub.com%2F%3Futm_source=AV_Club_Daily_RSS%26utm_medium=email%26utm_campaign=2020-12-29/1/01000176b0c6b237-52ae3f4d-b45f-4491-b49e-ffa9e1f4ee43-000000/oe0UYLOzJhEL_T76EaNeZFgRGtpUkrUgUGqLu5zK4QE=173')

			var resolvedLinkSet = await tools.resolveLinks(linkset)
			expect(resolvedLinkSet.links.length).toBeGreaterThan(0)
			expect(resolvedLinkSet.links[0].source).toEqual('https://tv.avclub.com/a-teacher-departs-1845935733')
			expect(resolvedLinkSet.links[0].title).toEqual('What\'s On Tonight: December 29, 2020: A Teacher finale')
			done()
		});
		mailparser.write(fileTwo);
		mailparser.end();
	}, 600000)
	it('should resolve problem links', async (done) => {
		// This one can't be crawled
		// https://hubspot.fedscoop.com/e2t/tc/MWvcPNgnsh3W79LX1j6nwjf0W8fXtNV4lstWPMBB8SL2-GZQV1-WJV7CgZ1mW2dMh-Z1jqz1KN26x4n0wQm4gW3pPh3Z85pcthW7sWy6N2T-N8tW7JT5x_3jWtY2W33TXs68-pT8kN6fhJR-SvN-MW3cbRPL7dWtT3W9gw_8d9gjxLwW69_RD_72KCDHW7f1Q-h4wsGf2W7TJlpB7BPchRW1wsp7C4Mx0SpW964gTj5TWLbpVg_sqn8LgJN5W1qTLV-2XGk_-W4NMR6Q6fp8HSW6KPHKS62dgHV3qfx1
		// https://s2.washingtonpost.com/2a970c9/5ff4606e9d2fda0efba0716e/596a51ce9bbc0f0e09ea0fc6/6/53/5ff4606e9d2fda0efba0716e
		// https://email.mg2.substack.com/c/eJxFkMuOhCAQRb-m2Y3hpd29YNGb-Q1DQ6lkBAwUOvbXD-piksotUrn14BiNMMa0qyVmJIf0uC-gAmx5BkRIpGRIvbNKio6Rmix7tA_icj8kAK_drDAVIEt5z85odDEc7sed3zmZlB1Ag2atACoGCZJ1XcfZwLTtrDHWXDt1sQ6CAQUrpD0GILOaEJd8E68b_66xbVsTdnQecmOirxVOOauJniKrlFxlibNDZ87nMfGrHueXZkI_E6eOHspoy2TLW9awZl0-Uf6uzw-Ym6R-5E0u74za_BxbSFKjW8HDHkv6R1KdOmn_yY0__91Xqy_B4d5D0O8Z7IUEL6onpH6EAKnStr1GxTr6rBTFnXFBLwSVmWBUCkE5qTfYWLuC8jEFF8Y8Rcx_KZ6TBg 
		// http://email.substack2.sinocism.com/c/eJxFkU0O3CAMhU8z2SUCQv4WLLrpNZADJkFNIAVnovT0JTOqKlm2kJ_N02cDhEtMtzpipupJmu4DVcArb0iEqTozJu2tkm3PK6vM3LaTrXzWLiHu4DdF6cTqOOfNGyAfw6MW1aosw8FNTDIzmMGJ1vXS9cil6MZWtNZ8_4PTegwGFb4x3TFgtamV6Miv9sdL_CxxXVdzQV59WCiGZ6gxcX8aMW22VMge9AHGO2_K0xQl1IRmrS0CrfXhgz1jidIUTPBS2Cd1j7ofZ2uHvpboXM05zjVw19XOghOjcQYmpjMVSM1K-1Z59axgnHVCsL6bGt7AuxO_ablkjC_J8jlnAvNLNNmHaHzeH7tVUot_4453PNN_vEUPCfY_udk_DHWR7mfwdGsMMG9ov3jpe6EPcL1gwFQuZzWQ4j2bxlFKPknGv0gL_7b4G3i5WHFjY5kK6p-bv2PXq0I
		// https://e.newsletters.cnn.com/click/EZ2l2ZW1leW91cm5ld3NsZXR0ZXJAYXJhbXpzLm1l/CeyJtaWQiOiIxNjEwNDA3ODk5NDk3MDhlNTdmZmRiYzE3IiwiY3QiOiJjbm4tNjFkNmUwMDA1MTA1YmE3NmM3NGViYzBlOGJhZmIzY2MtMSIsInJkIjoiYXJhbXpzLm1lIn0/HWkhfQ05OX2lfTmV3c19OREJBTjAxMTEyMDIxMjczNDU0MSxjbjEsaHR0cHM6Ly93d3cuY25uLmNvbS9wb2xpdGljcy9saXZlLW5ld3MvdHJ1bXAtaW1wZWFjaG1lbnQtbmV3cy0wMS0xMS0yMS9oXzhjNTNiZjMxYzVhZWM0OGZlNjg0NjAxYWRiZTI4M2Vk/qP3V0bV90ZXJtPTE2MTA0MDc4OTk0OTcwOGU1N2ZmZGJjMTcmdXRtX3NvdXJjZT1jbm5fVGhlK1BvaW50KyVFMiU4MCU5MytNb25kYXklMkMrSmFudWFyeSsxMSUyQysyMDIxJnV0bV9tZWRpdW09ZW1haWwmdXRtX2NhbXBhaWduPTE2MTA0MDc4OTk0OTkmYnRfZWU9Zlp6ekklMkJVJTJCV2lEU3JSdm54JTJGSlQyY3Z6VzY1QkFmeWp0N014JTJCZUg2cml4MGFmVEY5eHg5biUyQnZFelJmd2pCeHkmYnRfdHM9MTYxMDQwNzg5OTQ5OQ/s3de00a1c53
		expect.assertions(8)
		/** const result = await tools.resolveLinks(
			{
				links: ['https://s2.washingtonpost.com/2a970c9/5ff4606e9d2fda0efba0716e/596a51ce9bbc0f0e09ea0fc6/6/53/5ff4606e9d2fda0efba0716e']
			}
		)
		expect(result.links[0].source).not.toEqual('https://s2.washingtonpost.com/2a970c9/5ff4606e9d2fda0efba0716e/596a51ce9bbc0f0e09ea0fc6/6/53/5ff4606e9d2fda0efba0716e')
		expect(result.links[0].source).not.toEqual('https://www.washingtonpost.com/politics/powerpost/the-health-202/?utm_campaign=wp_the_health_202&utm_medium=email&utm_source=newsletter&wpisrc=nl_health202')
		expect(result.links[0].source).toEqual('https://www.washingtonpost.com/politics/powerpost/the-health-202/') **/
		const result2 = await tools.resolveLinks(
			{
				links: ['http://email.substack2.sinocism.com/c/eJxFkU0O3CAMhU8z2SUCQv4WLLrpNZADJkFNIAVnovT0JTOqKlm2kJ_N02cDhEtMtzpipupJmu4DVcArb0iEqTozJu2tkm3PK6vM3LaTrXzWLiHu4DdF6cTqOOfNGyAfw6MW1aosw8FNTDIzmMGJ1vXS9cil6MZWtNZ8_4PTegwGFb4x3TFgtamV6Miv9sdL_CxxXVdzQV59WCiGZ6gxcX8aMW22VMge9AHGO2_K0xQl1IRmrS0CrfXhgz1jidIUTPBS2Cd1j7ofZ2uHvpboXM05zjVw19XOghOjcQYmpjMVSM1K-1Z59axgnHVCsL6bGt7AuxO_ablkjC_J8jlnAvNLNNmHaHzeH7tVUot_4453PNN_vEUPCfY_udk_DHWR7mfwdGsMMG9ov3jpe6EPcL1gwFQuZzWQ4j2bxlFKPknGv0gL_7b4G3i5WHFjY5kK6p-bv2PXq0I']
			},
			null,
			'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
		)
		expect(result2.links[0].source).not.toEqual('http://email.substack2.sinocism.com/c/eJxFkU0O3CAMhU8z2SUCQv4WLLrpNZADJkFNIAVnovT0JTOqKlm2kJ_N02cDhEtMtzpipupJmu4DVcArb0iEqTozJu2tkm3PK6vM3LaTrXzWLiHu4DdF6cTqOOfNGyAfw6MW1aosw8FNTDIzmMGJ1vXS9cil6MZWtNZ8_4PTegwGFb4x3TFgtamV6Miv9sdL_CxxXVdzQV59WCiGZ6gxcX8aMW22VMge9AHGO2_K0xQl1IRmrS0CrfXhgz1jidIUTPBS2Cd1j7ofZ2uHvpboXM05zjVw19XOghOjcQYmpjMVSM1K-1Z59axgnHVCsL6bGt7AuxO_ablkjC_J8jlnAvNLNNmHaHzeH7tVUot_4453PNN_vEUPCfY_udk_DHWR7mfwdGsMMG9ov3jpe6EPcL1gwFQuZzWQ4j2bxlFKPknGv0gL_7b4G3i5WHFjY5kK6p-bv2PXq0I')
		expect(result2.links[0].source).toEqual('https://www.washingtonpost.com/world/asia_pacific/china-tech-death-pinduoduo/2021/01/05/c68bdd76-4eff-11eb-a1f5-fdaf28cfca90_story.html')
		const result3 = await tools.resolveLinks(
			{
				links: ['https://email.mg2.substack.com/c/eJxFkMuOhCAQRb-m2Y3hpd29YNGb-Q1DQ6lkBAwUOvbXD-piksotUrn14BiNMMa0qyVmJIf0uC-gAmx5BkRIpGRIvbNKio6Rmix7tA_icj8kAK_drDAVIEt5z85odDEc7sed3zmZlB1Ag2atACoGCZJ1XcfZwLTtrDHWXDt1sQ6CAQUrpD0GILOaEJd8E68b_66xbVsTdnQecmOirxVOOauJniKrlFxlibNDZ87nMfGrHueXZkI_E6eOHspoy2TLW9awZl0-Uf6uzw-Ym6R-5E0u74za_BxbSFKjW8HDHkv6R1KdOmn_yY0__91Xqy_B4d5D0O8Z7IUEL6onpH6EAKnStr1GxTr6rBTFnXFBLwSVmWBUCkE5qTfYWLuC8jEFF8Y8Rcx_KZ6TBg']
			},
			null,
			'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
		)
		expect(result3.links[0].source).not.toEqual('https://email.mg2.substack.com/c/eJxFkMuOhCAQRb-m2Y3hpd29YNGb-Q1DQ6lkBAwUOvbXD-piksotUrn14BiNMMa0qyVmJIf0uC-gAmx5BkRIpGRIvbNKio6Rmix7tA_icj8kAK_drDAVIEt5z85odDEc7sed3zmZlB1Ag2atACoGCZJ1XcfZwLTtrDHWXDt1sQ6CAQUrpD0GILOaEJd8E68b_66xbVsTdnQecmOirxVOOauJniKrlFxlibNDZ87nMfGrHueXZkI_E6eOHspoy2TLW9awZl0-Uf6uzw-Ym6R-5E0u74za_BxbSFKjW8HDHkv6R1KdOmn_yY0__91Xqy_B4d5D0O8Z7IUEL6onpH6EAKnStr1GxTr6rBTFnXFBLwSVmWBUCkE5qTfYWLuC8jEFF8Y8Rcx_KZ6TBg')
		expect(result3.links[0].source).toEqual('https://www.nytimes.com/2021/01/04/us/politics/pence-trump.html')
		const result4 = await tools.resolveLinks(
			{
				links: ['https://e.newsletters.cnn.com/click/EZ2l2ZW1leW91cm5ld3NsZXR0ZXJAYXJhbXpzLm1l/CeyJtaWQiOiIxNjEwNDA3ODk5NDk3MDhlNTdmZmRiYzE3IiwiY3QiOiJjbm4tNjFkNmUwMDA1MTA1YmE3NmM3NGViYzBlOGJhZmIzY2MtMSIsInJkIjoiYXJhbXpzLm1lIn0/HWkhfQ05OX2lfTmV3c19OREJBTjAxMTEyMDIxMjczNDU0MSxjbjEsaHR0cHM6Ly93d3cuY25uLmNvbS9wb2xpdGljcy9saXZlLW5ld3MvdHJ1bXAtaW1wZWFjaG1lbnQtbmV3cy0wMS0xMS0yMS9oXzhjNTNiZjMxYzVhZWM0OGZlNjg0NjAxYWRiZTI4M2Vk/qP3V0bV90ZXJtPTE2MTA0MDc4OTk0OTcwOGU1N2ZmZGJjMTcmdXRtX3NvdXJjZT1jbm5fVGhlK1BvaW50KyVFMiU4MCU5MytNb25kYXklMkMrSmFudWFyeSsxMSUyQysyMDIxJnV0bV9tZWRpdW09ZW1haWwmdXRtX2NhbXBhaWduPTE2MTA0MDc4OTk0OTkmYnRfZWU9Zlp6ekklMkJVJTJCV2lEU3JSdm54JTJGSlQyY3Z6VzY1QkFmeWp0N014JTJCZUg2cml4MGFmVEY5eHg5biUyQnZFelJmd2pCeHkmYnRfdHM9MTYxMDQwNzg5OTQ5OQ/s3de00a1c53']
			},
			false,
			false
		)
		expect(result4.links[0].source).toEqual('https://www.cnn.com/politics/live-news/trump-impeachment-news-01-11-21/index.html')
		const result5 = await tools.resolveLinks(
			{
				links: ['https://email.mg2.substack.com/c/eJxFkcuOgzAMRb-m2YHyIEAXWcxmfgMZYiBqHp08ytCvn7RdjGTZlnUtXx0vkHEL8VT3kDJ5pSmfd1Qej2QxZ4ykJIyT0aoTPSO1aDbKkZg0rRHRgbEqx4LkXmZrFsgm-JeadbIXZFerFFTPK1ylpDgDnWFEMWiur7V2tP_chKIN-gUVPjCewSOxas_5ni7i68K_axzH0R6_xjDeLsHVAcRsFou18yHmvVkgBms8NFtEDxobyGuTEOKyNymHiM0aitfNzViLumG8bgrJ6cjlcOGCGMUpZ5SxnopukF3L2oA_jhZ4PIO-dNRtvE1lThmW28sDiWozD3R4hhL_eVUlRHDP1Lo3lKlKXfEmn1P1NdfbH175g_xNcNrQY6yv0BNkxXpGh34cB0mZ_PCpQAWTdGCyI9WDDnXLq925A_Fmzz8EX5vt']
			}
		)
		expect(result5.links[0].source).toEqual('https://www.wxii12.com/article/north-carolina-grenade-atf-search-store-found-killed-12/35208257')
		const result6 = await tools.resolveLinks(
			{
				links: ['https://www.washingtonpost.com/opinions/2021/01/15/vaccines-america-must-balance-speed-equity/']
			},
			false,
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Chrome/41.0.2272.118 Safari/537.36'
		)
		expect(result6.links[0].title).toEqual('Opinion | On vaccines, America must balance speed and equity - The Washington Post')
		const result7 = await tools.resolveLinks(
			{
				links: ['https://nyc.us20.list-manage.com/track/click?u=73d98c6dfc90032198ec7bdee&id=07bc331363&e=e3dbec9412']
			}
		)
		expect(result7.links[0].title).toEqual('Why is De Blasio’s $1 Million Climate Plan Hidden from East Harlem? - THE CITY')
		done()
	}, 20000)
	it('should resolve a link set cleanly', () => {
		const linkSet = [
			{ source: 'http://example.com/blah' },
			{ source: 'http://example.com/' },
			{ source: 'http://example.com/blah' },
			null
		]
		expect(tools.cleanLinkSet(linkSet).length).toBe(1)
	})
});