'use strict';
exports.handler = (event, context, callback) => {
    
    // Extract the request from the CloudFront event that is sent to Lambda@Edge 
    var request = event.Records[0].cf.request;

    // Extract the URI from the request
    var olduri = request.uri;
	var newuri = olduri;
	// This redirect should prob be handled with a 300 style redirect to a canonical page with a slash at the end? https://aws.amazon.com/blogs/networking-and-content-delivery/handling-redirectsedge-part1/
	if (!request.uri.match(/\/$/)){
		var stringSet = request.uri.split('.')

		if (!stringSet[stringSet.length - 1].match(/org|com|json|css|html|js|map/)){
			var newuri = olduri + '\/index.html'
		}
	} else {
		// Match any '/' that occurs at the end of a URI. Replace it with a default index
		var newuri = olduri.replace(/\/$/, '\/index.html');
	}

    
    // Log the URI as received by CloudFront and the new URI to be used to fetch from origin
    console.log("Old URI: " + olduri);
    console.log("New URI: " + newuri);
    
    // Replace the received URI with the URI that includes the index page
    request.uri = newuri;
    
    // Return to CloudFront
    return callback(null, request);

};