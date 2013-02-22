// Necessary to bypass PeopleSoft's stupid XHR crossdomain errors
document.domain = "ps.umbc.edu";
// Debugging
console.log("Set document.domain = ps.umbc.edu in the iframe.");

// This allows the injected JavaScript to be run in the context of the page instead of this file.
// We need to inject the function that updates the div with the class text since PeopleSoft will pick up any form of event handlers.
// This means that the only way to execute scripts must be using <a href="javascript:[CODE]">Link</a>, which is truly quite unfortunate,
// but the only way to bypass the page's document-level keypress event handlers without destroying them.
// Credit: http://voodooattack.blogspot.com/2010/01/writing-google-chrome-extension-how-to.html / http://opensource.org/licenses/mit-license.php
// Usage:
//  Objects: injectScript(JSON.stringify(myObj)) // myObj will now exist in the context of the page
//  Functions: injectScript('' + myFunc) // myFunc will now exist in the context the page
//  Function (run once): injectScript(myFunc) // myFunc is run as an anonymous function in the context of the page
//  Function (return value): returnVal = injectScript(myFunc) // returnVal will contain whatever value is returned from the function
function injectScript(source)
{
     
    // Utilities
    var isFunction = function (arg) { 
        return (Object.prototype.toString.call(arg) == "[object Function]"); 
    };
     
    var jsEscape = function (str) { 
        // Replaces quotes with numerical escape sequences to
        // avoid single-quote-double-quote-hell, also helps by escaping HTML special chars.
        if (!str || !str.length) return str;
        // use \W in the square brackets if you have trouble with any values.
        var r = /['"<>\/]/g, result = "", l = 0, c; 
        do{    c = r.exec(str);
            result += (c ? (str.substring(l, r.lastIndex-1) + "\\x" + 
                c[0].charCodeAt(0).toString(16)) : (str.substring(l)));
        } while (c && ((l = r.lastIndex) > 0))
        return (result.length ? result : str);
    };
 
    var bFunction = isFunction(source);
    var elem = document.createElement("script");    // create the new script element.
    var script, ret, id = "";
 
    if (bFunction)
    {
        // We're dealing with a function, prepare the arguments.
        var args = [];
 
        for (var i = 1; i < arguments.length; i++)
        {
            var raw = arguments[i];
            var arg;
 
            if (isFunction(raw))    // argument is a function.
                arg = "eval(\"" + jsEscape("(" + raw.toString() + ")") + "\")";
            else if (Object.prototype.toString.call(raw) == '[object Date]') // Date
                arg = "(new Date(" + raw.getTime().toString() + "))";
            else if (Object.prototype.toString.call(raw) == '[object RegExp]') // RegExp
                arg = "(new RegExp(" + raw.toString() + "))";
            else if (typeof raw === 'string' || typeof raw === 'object') // String or another object
                arg = "JSON.parse(\"" + jsEscape(JSON.stringify(raw)) + "\")";
            else
                arg = raw.toString(); // Anything else number/boolean
 
            args.push(arg);    // push the new argument on the list
        }
 
        // generate a random id string for the script block
        while (id.length < 16) id += String.fromCharCode(((!id.length || Math.random() > 0.5) ?
            0x61 + Math.floor(Math.random() * 0x19) : 0x30 + Math.floor(Math.random() * 0x9 )));
 
        // build the final script string, wrapping the original in a boot-strapper/proxy:
        script = "(function(){var value={callResult: null, throwValue: false};try{value.callResult=(("+
            source.toString()+")("+args.join()+"));}catch(e){value.throwValue=true;value.callResult=e;};"+
            "document.getElementById('"+id+"').innerText=JSON.stringify(value);})();";
 
        elem.id = id;
    }
    else // plain string, just copy it over.
    {
        script = source;
    }
 
    elem.type = "text/javascript";
    elem.innerHTML = script;
 
    // insert the element into the DOM (it starts to execute instantly)
    document.head.appendChild(elem);
 
    if (bFunction)
    {
        // get the return value from our function:
        ret = JSON.parse(elem.innerText);
 
        // remove the now-useless clutter.
        elem.parentNode.removeChild(elem);
 
        // make sure the garbage collector picks it instantly. (and hope it does)
        delete (elem);
 
        // see if our returned value was thrown or not
        if (ret.throwValue)
            throw (ret.callResult);
        else
            return (ret.callResult);
    }
    else // plain text insertion, return the new script element.
        return (elem);
}


// Generates the HTML content of the div that contains the text of the classes
// The parameters are booleans indicating whether each specified piece of data will be displayed
// This function will be injected into the page so it can run under that context
// Relies on the classes object being populated under the current context
function generateClassesText(code, title, times, sections, instructor, location, component) {
  uiHTML = "";
  // Loop through each class
  for (var i = 0, length = classes.length; i < length; i++) {
    if (classes[i][1] == "Enrolled") {
      // Class code and title
      uiHTML += "<strong>";
      if (code) {uiHTML += classes[i][0].slice(0, classes[i][0].indexOf("-")-1)}
      if (title) {
        if (code) {uiHTML += " - "}
        uiHTML += classes[i][0].slice(classes[i][0].indexOf("-")+1, classes[i][0].length);
      }
      uiHTML += "</strong>";
      if (times || sections || instructor || location || component) {uiHTML += ": ";}

      // Loop through each section
      for (var e = 0, len = classes[i][2].length; e < len; e++) {
        // Component
        if (component) {
          uiHTML += classes[i][2][e][0];
          if (!sections) {uiHTML += ". "} else {uiHTML += " "}
        }
        // Section Number
        if (sections) {
          uiHTML += classes[i][2][e][2];
          if (times || instructor) {uiHTML += ". "}
        }
        // Section Times
        if (times) {uiHTML += classes[i][2][e][1]}
        // Instructor
        if (instructor) {
          if (times) {uiHTML += " ("}
          uiHTML += classes[i][2][e][4];
          if (times) {uiHTML += ")"}
        }
        // Location/Room
        if (location) {
          if (times || instructor) {uiHTML += " @ "} 
          uiHTML += classes[i][2][e][3]}
        // Add comma if not the last section
        if (e + 1 < len && (times || sections || instructor || location || component)) {uiHTML += ", ";}
      }
      uiHTML += "<br>";
    }
  }
  document.querySelector("#classesDiv").innerHTML = uiHTML;
}

// Posts a message from the context of the page that will be received here and then sent to background.js to be written to clipboard
// This function will be injected into the page so it can run under that context
function copyClasses() {
  window.postMessage({ type: "FROM_PAGE", text: document.querySelector("#classesDiv").innerText }, "*");
  button = document.getElementById("copyButton");
  button.innerText = "Copied!";
  setTimeout(function() { button.innerText = "Copy"; }, 1500);
}

function screenshot() {
  window.postMessage({ type: "FROM_PAGE", text: "screenshot" }, "*");
}

// Tests the HTML against our regex to determine if we're in 'List View' or 'Weekly Calendar View' (or neither)
var listViewRegex = /win0divDERIVED_REGFRM1_SA_STUDYLIST_SHOW/; // this is from the 'View Textbooks' link, which I'm fairly certain only appears in this view
var weeklyViewRegex = /DERIVED_CLASS_S_SSR_REFRESH_CAL/; // this is from the 'Refresh Calendar' button in weekly view

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// List View ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
if (listViewRegex.test(document.body.innerHTML)) { // List view was detected
  // Initialize classes object; this will contain all the information for the classes processed from the DOM
  var classes = [];
  console.log("Detected schedule page (List view).");

  // Get classes
  classNodes = document.querySelectorAll("td.PAGROUPDIVIDER")
  for (var i = 0, length = classNodes.length; i < length; i++) {
    // Get the class title, i.e. "BIOL 303 - Cell Biology"
    classTitle = classNodes[i].innerText;
    // Get the parent node that will contain the rest of the information we want about this class
    parentTable = classNodes[i].parentNode.parentNode;
    // Get the class status, i.e. Dropped or Enrolled
    classStatus = parentTable.querySelector('span[id^="STATUS"]').innerText;
    // Get the section rows
    sectionNodes = parentTable.querySelectorAll('tr[id^="trCLASS_MTG_VW"]');
    var sections = [];
    for (var e = 0, elen = sectionNodes.length; e < elen; e++) {
      // For each section, get the span node that contains the relevant data
      classNum = sectionNodes[e].querySelector('span[id^="DERIVED_CLS_DTL_CLASS_NBR"]');
      component = sectionNodes[e].querySelector('span[id^="MTG_COMP"]');
      times = sectionNodes[e].querySelector('span[id^="MTG_SCHED"]');
      section = sectionNodes[e].querySelector('a[id^="MTG_SECTION"]');
      room = sectionNodes[e].querySelector('span[id^="MTG_LOC"]');
      instructor = sectionNodes[e].querySelector('span[id^="DERIVED_CLS_DTL_SSR_INSTR_LONG"]');
      // Add section information to array with nulltype checking and some string-processing
      sections.push([component, times, section, room, instructor].map(function(a) {
        if (!!a) {return a.innerText.replace(/^\s+|\s+$/g, '').replace("\n","")} else {return ""}
      }));
    }

    // Put everything in one array; this object will be used by generateClassesText() and gets injected into the page
    classes.push([classTitle, classStatus, sections]);
  }
  // Debugging
  console.log("Created 'classes' object.");
  
  // Create the floating container for the extension's interface
  ui = document.createElement("div");
  ui.setAttribute("id", "weeklyView");
  ui.setAttribute("class", "uiContainer");
  uiHTML =  '<h1>My Schedule <small><em>Tip:</em> You can edit the box below.</small></h1>' +
            '<div id="classesDiv" contenteditable="true"></div>' +
            '<div>' +
              '<strong>Display:</strong> ' +
              // For reference: generateClassesText(code, title, times, sections, instructor, location, component)
              '<a href="javascript:generateClassesText(true, true, false, false, false, false, false)">Minimal</a> ' +
              '<a href="javascript:generateClassesText(true, false, true, false, false, false, false)">Code and Times</a> ' +
              '<a href="javascript:generateClassesText(true, false, false, true, false, false, true)">Sect. + Code</a> ' +
              '<a href="javascript:generateClassesText(true, true, true, true, true, true, true)">Everything</a>' +
              '<br><strong>Share:</strong> ' +
              '<a id="copyButton" href="javascript:copyClasses()">Copy</a> ' +
              '<a href="javascript:postToFB()">Post to Facebook</a>' +
            '</div>';
  ui.innerHTML = uiHTML;
  // Add the ui to the page
  document.body.appendChild(ui);

  // Inject scripts to the page so they can run in that context
  // This is necessary because PeopleSoft monitors onkeypress/onkeydown/onkeyup events and throws authorization errors (i.e.: checkbox clicked -> auth error)
  // Since event-binding is out, a workaround is to use links to invoke JS functions; in order to do this, those functions first need to be injected to the context of the page
  injectScript('classes = '  + JSON.stringify(classes) + ';' + // Inject the 'classes' object so it can be used by generateClassesText
  generateClassesText +  // Inject the function to generate the contents of classesDiv
  copyClasses + // Injects the function that will post a message indicating the user wants to copy the contents of classesDiv
  'generateClassesText(false, true, true, false, false, false, false);'); // Run generateClassesText() once at minimal settings
  // TODO: Remember last state of classesDiv?
  
  // Listen to messages posted from the page context
  var port = chrome.extension.connect();
  window.addEventListener("message", function(event) {
      // We only accept messages from ourselves
      if (event.source != window)
        return;
      if (event.data.type && (event.data.type == "FROM_PAGE")) {
        // Relay message to background page (since we can only do execCommand('copy') there)
        chrome.extension.sendMessage({copy: event.data.text}, function(response) {});
        // Debugging
        console.log("Received message from page:");
        console.log(event.data.text);
      }
  }, false);

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Weekly View //////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
} else if (weeklyViewRegex.test(document.body.innerHTML)) { // Weekly view was detected
  console.log('Detected schedule page (Weekly view).');

  // Create the floating container for the extension's interface
  ui = document.createElement("div");
  ui.setAttribute("id", "scheduleView");
  ui.setAttribute("class", "uiContainer");
  uiHTML =  '<a href="javascript:screenshot()">Screenshot</a>';
  ui.innerHTML = uiHTML;
  // Add the ui to the page
  document.body.appendChild(ui);

  // Inject the screenshot() function
  injectScript("" + screenshot);
  
  // Get message from page
  var port = chrome.extension.connect();
  window.addEventListener("message", function(event) {
      // We only accept messages from ourselves
      if (event.source != window)
        return;
      if (event.data.type && (event.data.type == "FROM_PAGE")) {
        // Calculate width and height of the table for cropping
        var width = document.getElementById("WEEKLY_SCHED_HTMLAREA").offsetWidth;
        var height = document.getElementById("WEEKLY_SCHED_HTMLAREA").offsetHeight;
        // Send the message (will be received by background.js)
        chrome.extension.sendMessage({msg: "screenshot", width: width, height: height}, function(response) {});
        // Debugging
        console.log("Received message from page:");
        console.log(event.data.text);
      }
  }, false);

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

} else { // Neither of the views were detected
  // Debugging
  console.log("No schedule detected in iframe.");
}