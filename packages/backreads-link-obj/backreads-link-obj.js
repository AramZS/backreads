class LinkObj {
	constructor(aLink) {
		this.title = aLink.title || ""
		this.source = aLink.source || ""
		this.description = aLink.description || ""
		this.tags = aLink.tags || []
		this.image = aLink.image || ""
		this.date = aLink.date || ""
		this.platform = aLink.platform || "";
		if (aLink.weight){
			this.weight = aLink.weight
		}
	}
}

LinkObj.prototype.fill = function(linkObj, reverse){
	var newLinkObj = new LinkObj(linkObj)
	if (reverse){
		return Object.assign(newLinkObj, this);
	} else {
		return Object.assign(this, newLinkObj);
	}
}

exports.LinkObj = LinkObj
