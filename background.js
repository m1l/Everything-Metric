var metricIsEnabled = true;




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
}

var useComma ;//= localStorage.getItem('metricIsEnabled');
var useMM  ;//localStorage.getItem('useMM');
var useRounding ;//= local
var useMO;
var useGiga;
var useSpaces;


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
  useSpaces:true
  }, function(items) {    
    useComma = items.useComma;
    useMM = items.useMM;
    useRounding = items.useRounding; 
    useMO = items.useMO;
    useGiga = items.useGiga;
    useSpaces = items.useSpaces;
      if (items.isFirstRun===true) 
          {
              console.log("firstrun");
              try {
                  chrome.storage.sync.set({ isFirstRun: false });
                  var openingPage = chrome.runtime.openOptionsPage();
              } catch(err) {}
          }
      //if (useComma===undefined) useComma = false;
      //if (useMM===undefined) useMM = false;
      //if (useRounding===undefined) useRounding = true;
  }); 
}
restore_options();

chrome.browserAction.onClicked.addListener(function(tab){

    toggleMetric();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.reload(tabs[0].id);
    });

    
});
    