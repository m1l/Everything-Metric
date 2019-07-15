function save_options() {
  //e.preventDefault();
  //chrome.storage.local.set({
  //metricIsEnabled: document.getElementById('useComma').checked,
  //    useMM: document.getElementById('useMM').checked,
  //   useRounding: document.getElementById('useRounding').checked
  //});
  //localStorage.setItem('useComma',document.getElementById('useComma').checked);
  //localStorage.setItem('useMM',document.getElementById('useMM').checked);
  //localStorage.setItem('useRounding',document.getElementById('useRounding').checked);
   // alert("asdf");
    var useComma = document.getElementById('useComma').checked;
    var useMM = document.getElementById('useMM').checked;
    var useRounding = document.getElementById('useRounding').checked;
    var useMO = document.getElementById('useMO').checked;
    var useGiga = document.getElementById('useGiga').checked;
    var useSpaces = document.getElementById('useSpaces').checked;
  chrome.storage.sync.set({
        useComma: useComma,  
        useMM: useMM,
        useRounding: useRounding,
      isFirstRun: false,
      useMO: useMO,
      useGiga: useGiga,
      useSpaces: useSpaces
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Saved. Refresh individual pages to see changes.';
    
      
       chrome.runtime.sendMessage(
            "reload settings",
            function (response) { 
                
            }
        );
      /*setTimeout(function() {
          status.textContent = '';
          window.close();
        }, 3000);*/
  });
    
}



  /*
  var useComma = localStorage.getItem('useComma');
  var useMM = localStorage.getItem('useMM');
  var useRounding = localStorage.getItem('useRounding');
    
    if (useComma===undefined) useComma = false;
    if (useMM===undefined) useMM = false;
    if (useRounding===undefined) useRounding = true;
    */
 function restore_options() {
     try {
          chrome.storage.sync.get({
          useComma: true,
          useMM: false,
          useRounding: true,
          isFirstRun:false,
          useMO:false,
          useGiga: false,
          useSpaces: true
          }, function(items) {
            document.getElementById('useComma').checked = items.useComma;
            document.getElementById('useMM').checked = items.useMM;
            document.getElementById('useRounding').checked = items.useRounding;
              document.getElementById('useMO').checked = items.useMO;
              document.getElementById('useGiga').checked = items.useGiga;
              document.getElementById('useSpaces').checked = items.useSpaces;
          });
     } catch(err) { console.log(err.message);}
  //document.getElementById('useComma').checked = useComma;
  //document.getElementById('useMM').checked = useMM;
  //document.getElementById('useRounding').checked = useRounding;
    
}
restore_options();
document.addEventListener("DOMContentLoaded", restore_options);
//document.querySelector("form").addEventListener("submit", saveOptions);
//document.getElementById('save').addEventListener('click',saveOptions);
document.getElementById('save').addEventListener('click', save_options);
//document.querySelectorAll('input').addEventListener('click', save_options);
var _selector = document.querySelector('input');
    _selector.addEventListener('change', function (event) {
        save_options();
    });
