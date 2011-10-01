function downloadURL(url) {
	var downloadLink = document.createElement("a");
	downloadLink.href = url;
	var event = document.createEvent("MouseEvents");
	event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, true, false, false, 0, null);
	downloadLink.dispatchEvent(event);
}

function openInQuickTimePlayer(url) {
	var embed = document.createElement("embed");
	embed.allowedToLoad = true;
	embed.className = "CTPallowedToLoad";
	embed.setAttribute("type", "video/quicktime");
	embed.setAttribute("width", "0");
	embed.setAttribute("height", "0");
	embed.setAttribute("src", "http://images.apple.com/apple-events/includes/qtbutton.mov");
	embed.setAttribute("href", url);
	embed.setAttribute("target", "quicktimeplayer");
	embed.setAttribute("autohref", "true");
	document.body.appendChild(embed);
}

function handleMessageEvent(event) {
	switch(event.name) {
		case "download":
			downloadURL(event.message);
			break;
		case "qtp":
			openInQuickTimePlayer(event.message);
			break;
	}
}

// Media elements
function handleBeforeLoadEvent(event) {
	var media = event.target;
	if(!(media instanceof HTMLMediaElement)) return;
	if(/\bCTPmediaElement\b/.test(media.className)) return; // CTP compatibility
	if(event.url === media.poster) return; // posters fire beforeload events
	
	var settings = safari.self.tab.canLoad(event, "");
	
	switch(settings.override) {
	case "preload":
		media.preload = "none";
	case "autoplay":
		media.autoplay = false;
		break;
	}

	var overlay;
	
	// Site-specific hacks
	if(location.host.indexOf("apple.com") !== -1) {
		overlay = media.parentNode.getElementsByClassName("ACMediaControls")[0];
	} else if(location.host.indexOf("vimeo.com") !== -1) {
		overlay = media.parentNode.parentNode;
	} else if(location.host.indexOf("exposureroom.com") !== -1) {
		return;
	}
	
	// YouTube5
	if(media.nextSibling && media.nextSibling.className === "youtube5overlay") {
		overlay = media.nextSibling;
	}
	
	if(!overlay) overlay = media;
	
	// Resolve URL
	var anchor = document.createElement("a");
	anchor.href = event.url;
	var url = anchor.href;
	
	overlay.addEventListener("contextmenu", function(e) {
		safari.self.tab.setContextMenuEventUserInfo(e, {"url": url, "isVideo": media instanceof HTMLVideoElement});
	}, false);
}

// Links
document.addEventListener("contextmenu", function(event) {
	var e = event.target;
	do {
		if(e instanceof HTMLAnchorElement) break;
	} while(e = e.parentNode);
	if(e && e.href) {
		if(/\bCTPsourceItem\b/.test(e.className)) return;
		safari.self.tab.setContextMenuEventUserInfo(event, {"url": e.href, "isLink": true});
	}
}, true); // sic

if(window === top) safari.self.addEventListener("message", handleMessageEvent, false);
document.addEventListener("beforeload", handleBeforeLoadEvent, true);
