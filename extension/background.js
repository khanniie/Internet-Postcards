// let color = '#3aa757';

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.sync.set({ color });
//   console.log('Default background color set to %cgreen', `color: ${color}`);
// });

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    
    if (request.message === "capture"){
      sendResponse({message: "loading"});

      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if(tab){
        chrome.tabs.captureVisibleTab(tab.windowId, {}, image => {
          //chrome.storage.local.set({savedImage: image});
          console.log(tab)
          chrome.runtime.sendMessage({message: "loaded", savedImage: image, url: tab.url}, function(res){
                console.log(res)
          });
        })
      } else {
        chrome.runtime.sendMessage({message: "error"});
      }
    }
      
  }
);