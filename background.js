// Listen to messages (from frame_content.js)
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        // Debugging
        console.log("Message received in background.js:");
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
        } else if (request["msg"] == "screenshot") {
            var width = request["width"];
            var height = request["height"];
            console.log("Screenshot processing in background.js ("+ width+"x"+height+")");
            
            // Create a canvas for the screenshot
            canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext("2d");
            // Capture the screen and save it to an image
            chrome.tabs.captureVisibleTab(
                null, {format: "png", quality: 100}, function(dataURI) {
                    if (dataURI) {
                        var image = new Image();
                        image.onload = function() {
                            console.log("Image loaded.");
                            ctx.drawImage(image, 24, 390, width, height, 0, 0, width, height);
                            dataURI = canvas.toDataURL();
                            //saveBlob(canvas.toDataURL()); // TODO: fix saving
                            // Open the screenshot
                            window.open(dataURI, "image");
                        };
                        image.src = dataURI;
                    }
                });

            // File saving
            function saveBlob(dataURI) {
                // Convert the screenshot image to a blob
                var byteString = atob(dataURI.split(",")[1]);
                var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                var blob = new Blob([ab], {type: mimeString});
                // Save the blob to file and open it when we're done writing
                function onwriteend() {
                    //window.open("filesystem:chrome-extension://" + chrome.i18n.getMessage("@@extension_id") + "/screenshot.png");
                }
                window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
                    fs.root.getFile("screenshot.png", {create:true}, function(fileEntry) {
                        fileEntry.createWriter(function(fileWriter) {
                            fileWriter.onwriteend = onwriteend;
                            fileWriter.write(blob);
                            console.log("Writing blob to file.");
                            console.log(blob);
                        });
                    });
                });
            }
        }
        // Return nothing to let the connection be cleaned up.
        sendResponse({});
    });