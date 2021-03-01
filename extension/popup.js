// Initialize butotn with users's prefered color
let changeColor = document.getElementById("changeColor");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  console.log("click 1")
  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   function: setPageBackgroundColor,
  // });

  chrome.runtime.sendMessage({message: "capture"}, function(response) {
    console.log(response);
  });

});


const setupListeners = () => {

  console.log("setting up listenrer")

  const bindImg = (img) => {
    let newimg = document.createElement("IMG");
    newimg.src = img;
    let imageContainer = document.getElementById("image-container");
    console.log(imageContainer)
    imageContainer.appendChild(newimg);
  }

  chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      console.log("I'm popup js and I'm doing a thing")
      if(request.message === "loaded"){
        console.log("SUCCESS", request.savedImage)
        bindImg(request.savedImage)
      } else {
        console.log(request)
      }
  })
}

setupListeners();

// The body of this function will be execuetd as a content script inside the
// current page
function setPageBackgroundColor() {
  // chrome.storage.sync.get("color", ({ color }) => {
  //   document.body.style.backgroundColor = color;
  // });

  chrome.runtime.sendMessage({greeting: "capture"}, function(response) {
    console.log(response);
    // chrome.storage.local.get("savedImage", ({savedImage}) => {
    //   console.log("retrieve image", savedImage)
    // });
  });

  console.log("clicked on button, sending message")
}


console.log("coming from popup js")