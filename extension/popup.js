// Initialize butotn with users's prefered color
let captureButton = document.getElementById("capture");
let startPage = document.getElementById("starting-page");
let continueButton = document.getElementById("continue");
let decorateButton = document.getElementById("decorate");
let rectcutter = document.getElementById("rect-cutter");
let svgBBox = rectcutter.getBoundingClientRect();
let imageContainer = document.getElementById("image-container");
let step = document.getElementById("step");
let specific_instruction = document.getElementById("specific");
let newimg;

let dragging = false;
let resizing = false;
let offsetX, offsetY;
let xpos = 0.1;
let ypos = 0.1;
let xscale = 0.6;
let yscale = 0.4;
let scale = 1;
let orgwid, orghei;
let scaleMin = 0.8;

const postcardWidth = 600;
const postcardHeight = 400;

let currentResizeDirection;
let scaleMode;
let rectCutterHeight;

let cleanupFunc = null;

const PHASES = {
  NOT_STARTED: 0,
  START:1,
  BOUNDINGBOX:2,
  DECORATE:3
}

const SCALE_MODE = {
  WIDTH: 0,
  HEIGHT:1
}

const RESIZE_DIRECTION = {
  NORTH: 0,
  EAST:1,
  SOUTH:2,
  WEST:3,
  NORTH_WEST: 4
}

let currentPhase = PHASES.NOT_STARTED;

const setupListeners = () => {

  chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      console.log("I'm popup js and I'm doing a thing")
      if(request.message === "loaded"){
        console.log("SUCCESS", request.savedImage)
        bindImg(request.savedImage)
        sendResponse({message: "thanks!"});
      } else if (request.message === "error"){
        document.getElementById("error").style.display = "block"
        document.getElementById("postcard").style.display = "none"
        document.getElementById("button-rows").style.display = "none"
      } else {
        console.log(request)
      }
  })
}

setupListeners();

const setupStartPhase = ()=>{
  //not much we need to do
  return (() => {
    captureButton.style.display = "none"
    startPage.style.display = "none"
  })
}

const setupBoundingBoxPhase = ()=>{
  continueButton.style.display = "block";
  rectcutter.style.display = "block";
  step.innerHTML = "Step 2";
  specific_instruction.innerHTML = "Crop the section of the image that you want to use.";
  
  return (() => {
    continueButton.style.display = "none";
    rectcutter.style.display = "none";
  })
}

const setupDecorate= ()=>{
  decorateButton.style.display = "block";
  step.innerHTML = "Step 3";
  specific_instruction.innerHTML = "Decorate the postcard!";

  return (() => {
    console.log("nothing to do for now")
  })
}

const switchPhase = () => {
  currentPhase++;
  if(cleanupFunc){
    cleanupFunc();
  }
  switch (currentPhase){
    case PHASES.START:
      cleanupFunc = setupStartPhase();
      break;
    case PHASES.BOUNDINGBOX:
      cleanupFunc = setupBoundingBoxPhase();
      break;
    case PHASES.DECORATE:
      cleanupFunc = setupDecorate();
      break;
  }
}

switchPhase();

//---- sending the capture click and receieving the response ---//
captureButton.addEventListener("click", async () => {
  chrome.runtime.sendMessage({message: "capture"}, function(response) {
    console.log(response);
  });
});

const bindImg = (img) => {
  newimg = new Image();
  newimg.src = img;
  newimg.onload = function(){
    let wid = this.width;
    let hei = this.height;
    imageContainer.appendChild(newimg);
    orgwid = wid;
    orghei = hei;
    let scaledWid, scaledHei;
    let aspectratio = wid/hei;
    if(wid/hei > postcardWidth/postcardHeight){
      scaledWid = postcardWidth;
      scaledHei = 1/aspectratio * postcardWidth;
      newimg.style.width = `${scaledWid}px`
      newimg.style.height = `${scaledHei}px`
      imageContainer.style.width = `${scaledWid}px`
      imageContainer.style.height = `${scaledHei}px`
      scaleMode = SCALE_MODE.WIDTH;
      rectCutterHeight = scaledWid;
    } else {
      scaledHei = postcardHeight;
      scaledWid = aspectratio * postcardHeight;
      newimg.style.width = `${scaledWid}px`
      newimg.style.height = `${scaledHei}px`
      imageContainer.style.width = `${scaledWid}px`
      imageContainer.style.height = `${scaledHei}px`
      rectcutter.style.width = `${scaledHei}px`
      rectcutter.style.height = `${scaledHei}px`
      if(wid/hei > 1){
        rectcutter.style.width = `${scaledWid}px`
        rectcutter.style.height = `${scaledWid}px`
        scaleMode = SCALE_MODE.WIDTH;
        rectCutterHeight = scaledWid;
      } else {
        rectcutter.style.width = `${scaledHei}px`
        rectcutter.style.height = `${scaledHei}px`
        scaleMode = SCALE_MODE.HEIGHT;
        rectCutterHeight = scaledHei;
        scaleMin = 1;
      }
    }
    
    switchPhase();
  }
}

document.getElementById("continue").addEventListener("click", () => {
  imageContainer.style.width = `${postcardWidth}px`;
  imageContainer.style.height = `${postcardHeight}px`;

  let cropped = document.createElement("CANVAS");
  let ctx = cropped.getContext("2d");

  cropped.width = postcardWidth;
  cropped.height = postcardHeight;
  
  if(scaleMode === SCALE_MODE.WIDTH){
    let aspectratio = rectCutterHeight/newimg.height;
    ypos = ypos * aspectratio;
    ctx.drawImage(newimg, orgwid * xpos, 
      orghei * ypos, orgwid * xscale * scale, 
      orghei * yscale * aspectratio * scale, 
      0, 0, postcardWidth, postcardHeight);
  } else {
    let aspectratio = newimg.width/newimg.height;
    console.log(scale, xscale, newimg.width, newimg.height);
    ctx.drawImage(newimg, orgwid * xpos, 
      orghei * ypos, orgwid * (xscale * scale)/aspectratio, 
      orghei * yscale * scale, 
      0, 0, postcardWidth, postcardHeight);
  }
  
  document.getElementById("image-container").append(cropped);
  switchPhase();
});

document.getElementById("rect-drag").addEventListener("mousedown", (evt) => {
  dragging = true;
  let bbox = document.getElementById("rect-drag").getBoundingClientRect();
  offsetX = evt.clientX - bbox.left;
  offsetY = evt.clientY - bbox.top;
  svgBBox = rectcutter.getBoundingClientRect();
});

let rectElements = document.getElementsByClassName("resize-rect");

for(var i = 0; i < rectElements.length; i++){
  let ele = rectElements[i];
  ele.addEventListener("mousedown", (evt) => {
    resizing = true;
    svgBBox = rectcutter.getBoundingClientRect();
    let targetid = evt.target.id;
    switch (targetid){
      case ("rect-resize-n"):
      case ("rect-resize-ne"):
        currentResizeDirection = RESIZE_DIRECTION.NORTH;
        break;
      case ("rect-resize-s"):
      case ("rect-resize-se"):
        currentResizeDirection = RESIZE_DIRECTION.SOUTH;
        break;
      case ("rect-resize-e"):
        currentResizeDirection = RESIZE_DIRECTION.EAST;
        break;
      case ("rect-resize-w"):
      case ("rect-resize-sw"):
        currentResizeDirection = RESIZE_DIRECTION.WEST;
        break;
      case ("rect-resize-nw"):
        currentResizeDirection = RESIZE_DIRECTION.NORTH_WEST;
        break;
    }
  })
}

rectcutter.addEventListener("mousemove", (evt) => {
  if(resizing){
    let mouseX = (evt.clientX - svgBBox.left)/(svgBBox.right - svgBBox.left);
    let mouseY = (evt.clientY - svgBBox.top)/(svgBBox.bottom - svgBBox.top);
    let bbox = document.getElementById("rect-drag").getBoundingClientRect();
    let bboxHeight = bbox.bottom - bbox.top;
    let bboxWidth = bbox.right - bbox.left;
    let t;
    let newxpos = -1;
    let newypos = -1;
    switch(currentResizeDirection){
      case RESIZE_DIRECTION.NORTH:
        newypos = mouseY;
        scale *= 1 + (bbox.top - evt.clientY)/bboxHeight;
        break;
      case RESIZE_DIRECTION.SOUTH:
        scale *= 1 + (evt.clientY - bbox.bottom)/bboxHeight;
        break;
      case RESIZE_DIRECTION.EAST:
        scale *= 1 + (evt.clientX - bbox.right)/bboxWidth;
        break;
      case RESIZE_DIRECTION.WEST:
        newxpos = mouseX;
        scale *= 1 + (bbox.left - evt.clientX)/bboxWidth;
        break;
      case RESIZE_DIRECTION.NORTH_WEST:
        let bot = ypos + (scale * yscale);
        scale *= 1 + (bbox.left - evt.clientX)/bboxWidth;
        newxpos = mouseX;
        newypos = bot - (scale * yscale);
        break;
    }
    if(scale > scaleMin){
      xpos = (newxpos < 0) ? xpos : newxpos;
      ypos = (newypos < 0) ? ypos : newypos;
    } else {
      scale = scaleMin;
    }

    if(scaleMode === SCALE_MODE.WIDTH){
      let aspectratio = newimg.height/rectCutterHeight;
      if(scale * xscale + xpos > 1){
        scale = (1-xpos)/xscale;
      }
      if(scale * yscale + ypos > aspectratio){
        scale = (aspectratio-ypos)/yscale;
      }
    } else {
      let aspectratio = newimg.width/rectCutterHeight;
      if(scale * xscale + xpos > aspectratio){
        scale = (aspectratio-xpos)/xscale;
      }
      if(scale * yscale + ypos > 1){
        scale = (1-ypos)/yscale;
      }
    }

   
    t = `translate3d(${xpos * 100}px,${ypos * 100}px, 0px) scale(${scale})`;
    document.getElementById("rect-container").style.transform = t;
   } else if(dragging){
      xpos = (evt.clientX - svgBBox.left - offsetX)/(svgBBox.right - svgBBox.left);
      ypos = (evt.clientY - svgBBox.top - offsetY)/(svgBBox.bottom - svgBBox.top);
      xpos = xpos > 0 ? xpos : 0;
      ypos = ypos > 0 ? ypos : 0;

      if(scaleMode === SCALE_MODE.WIDTH){
        let aspectratio = newimg.height/rectCutterHeight;
        xpos = xpos < (1 - xscale * scale) ? xpos : (1 - xscale * scale);
        ypos = ypos < (aspectratio - yscale * scale) ? ypos : (aspectratio - yscale * scale);
      } else {
        let aspectratio = newimg.width/rectCutterHeight;
        xpos = xpos < (aspectratio - xscale * scale) ? xpos : (aspectratio - xscale * scale);
        ypos = ypos < (1 - yscale * scale) ? ypos : (1 - yscale * scale);
      }
      
      t = `translate3d(${xpos * 100}px,${ypos * 100}px, 0px) scale(${scale})`;
      document.getElementById("rect-container").style.transform = t;
    } 
});

document.addEventListener("mouseup", () => {
  dragging = false;
  resizing = false;
});

const bindRectCutter = (wid, hei) => {
  console.log("rect cutter")
  //let imageContainer = document.getElementById("image-container");
  // rectcutter.style.width = `${wid}px`
  // rectcutter.style.height = `${hei}px`
  // rectcutter.width = wid;
  // rectcutter.height = hei;
  //let ctx = rectcutter.getContext("2d");
  // ctx.lineWidth = "3";
  // ctx.beginPath();
  // ctx.setLineDash([15, 5]);
  // ctx.rect(20, 20, 300, 200);
  // ctx.stroke();
  // imageContainer.appendChild(rectcutter);
}