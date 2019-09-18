var metricIsEnabled = true;
var useComma;
var useMM;
var useRounding;
var useMO;
var useGiga;
var useSpaces;
var useKelvin;
var convertBracketed;
var enableOnStart;
var matchIn;

function updateIcon() {
    if (metricIsEnabled===true)
	{
		chrome.browserAction.setIcon({
			path: {
				16: "icons/everything-metric-16.png",
				32: "icons/everything-metric-32.png",
				48: "icons/everything-metric-48.png",
				128: "icons/everything-metric-128.png"
			}
		});        
		chrome.browserAction.setTitle({title: "Automatic Metric/SI conversion is ON"});            
	}
    else
	{
		chrome.browserAction.setIcon({
			path: {
				16: "icons/everything-metric-16-off.png",
				32: "icons/everything-metric-32-off.png",
				48: "icons/everything-metric-48-off.png",
				128: "icons/everything-metric-128-off.png"
			}
		});
		chrome.browserAction.setTitle({title: "Automatic Metric/SI conversion is OFF"});           
	}
}  



function toggleMetric() {
	if (metricIsEnabled===true) {
		metricIsEnabled=false;
	} else {
		metricIsEnabled=true;
	}
	updateIcon();    
    
    chrome.storage.sync.set({
        enableOnStart: metricIsEnabled
	}, function() {		
	});
}




chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {   
        
        if (request.message==="Is metric enabled")
		{
			var response = {};
			response.metricIsEnabled = metricIsEnabled;
			response.useComma = useComma;
			response.useMM = useMM;
			response.useRounding = useRounding;
			response.useMO = useMO;
			response.useGiga = useGiga;
			response.useSpaces = useSpaces;
            response.useKelvin = useKelvin;
			response.useBold=useBold;
            response.useBrackets=useBrackets;
            response.useMetricOnly=useMetricOnly;
            response.convertBracketed=convertBracketed;
            response.enableOnStart=enableOnStart;
            response.matchIn=matchIn;
			sendResponse(response);
		}
        else { //request to reload
            restore_options();
            sendResponse("ok");
        }
    }
);

function restore_options() {
	chrome.storage.sync.get({
		useComma:true,
		useMM:false,
		useRounding:true,
		isFirstRun:true,
		useMO:false,
		useGiga:false,
		useSpaces:true,
        useKelvin:false,
        useBold: false,
        useBrackets: true,
        useMetricOnly: false,
        convertBracketed: false,
        enableOnStart: true,
        matchIn: false
	}, function(items) {    
		useComma = items.useComma;
		useMM = items.useMM;
		useRounding = items.useRounding; 
		useMO = items.useMO;
		useGiga = items.useGiga;
		useSpaces = items.useSpaces;
        useKelvin = items.useKelvin;
        useBold= items.useBold;
        useBrackets= items.useBrackets;
        useMetricOnly= items.useBold;
        convertBracketed = items.convertBracketed;
        enableOnStart = items.enableOnStart;
        matchIn = items.matchIn;
		if (items.isFirstRun===true) 
		{
			console.log("firstrun");
			try {
				chrome.storage.sync.set({ isFirstRun: false });
				
                //chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });
                 var optionsUrl = chrome.extension.getURL('options.html');

                    chrome.tabs.query({url: optionsUrl}, function(tabs) {
                        if (tabs.length) {
                            chrome.tabs.update(tabs[0].id, {active: true});
                        } else {
                            chrome.tabs.create({url: optionsUrl});
                        }
                    });
			} catch(err) {}
		}
        
       
	}); 
}
restore_options();

chrome.browserAction.onClicked.addListener(function(tab){
    toggleMetric();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.reload(tabs[0].id);
    });    
});

chrome.commands.onCommand.addListener( function(command) {
    if(command === "parse_page_now"){
       chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {command: "parse_page_now"}, function(response) {

          });
        });
     }
});
    