// Listen to messages (from frame_content.js)
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		// Debugging
		console.log("Request received!");
		console.log(request);

		// Copies the text to the clipboard
		if (request["copy"]) {
			// Create a container div from which text will be selected
			clipboardContainer = document.createElement("div");
			document.body.appendChild(clipboardContainer);
			// Insert text
			clipboardContainer.innerText = request["copy"];
			// Select the contents of the div
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(clipboardContainer);
			selection.removeAllRanges();
			selection.addRange(range);
			// Send copy command
			document.execCommand("Copy");

		// Takes a screenshot of the schedule table
		} else if (request["screenshot"]) {
		// TODO: Look at how Google's extension captures the whole page and do that here then crop it
			chrome.tabs.captureVisibleTab(null, {format: "png"}, function (image) {
				var imageBuffer = document.createElement("img");
				imageBuffer.src = image;
				imageBuffer.onload = function() {
					var canvas = document.createElement("canvas");
					canvas.width = window.innerWidth;
					canvas.height = window.innerHeight;
					var context = canvas.getContext("2d");
					context.drawImage(imageBuffer, 0, 0);
				window.open(image, "image");
				//window.open(canvas.toDataURL(), "canvas");
				};
			});
		}

		// Return nothing to let the connection be cleaned up.
		sendResponse({});
	});