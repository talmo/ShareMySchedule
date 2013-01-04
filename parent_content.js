// Necessary to bypass PeopleSoft's stupid XHR crossdomain errors
document.domain = "ps.umbc.edu";

// Debugging
console.log("Set document.domain = ps.umbc.edu in parent page.");

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log("Received request on parent.");
		sendResponse({});
	}
);