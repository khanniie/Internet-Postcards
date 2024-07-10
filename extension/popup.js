import {init as threejsinit, animate as threejsanimate, stop as threejsstop} from './threejs_font.js'

// Initialize butotn with users's prefered color
let captureButton = document.getElementById("capture");
let startPage = document.getElementById("starting-page");
let decorate = document.getElementById("decoration-container");
let movable = document.getElementById("movable-objects");
let continueButton = document.getElementById("continue");
let decorateButton = document.getElementById("decorate");
let rectcutter = document.getElementById("rect-cutter");
let svgBBox = rectcutter.getBoundingClientRect();
let imageContainer = document.getElementById("image-container");
let step = document.getElementById("step");
let specific_instruction = document.getElementById("specific");
let wishuTop = document.getElementById("wishu-top");
let wishuBottom = document.getElementById("wishu-bottom");
let trashcan= document.getElementById("trashcan");
let backOfPostcard = document.getElementById("back-of-postcard");
let frontOfPostcard = document.getElementById("front-of-postcard");
let preview = document.getElementById("preview");
let compiler = document.getElementById("compiler");
let card = document.getElementById("card");
let finalize = document.getElementById("finalize");
let order = document.getElementById("order");

let newimg;
let cropped;
let t;
let canvas;
let url;
let data;
let successfulResponse;

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

const postcardWidth = 1875;
const postcardHeight = 1350;
const postcardWidthStyle = 600;
const postcardHeightStyle = 425;

const scalingRatio = 3.17647058824;

let currentResizeDirection;
let scaleMode;
let rectCutterHeight;

let cleanupFunc = null;

const PHASES = {
  NOT_STARTED: 0,
  START:1,
  BOUNDINGBOX:2,
  DECORATE:3,
  ADDRESS:4,
  PREVIEW: 5,
  ORDER: 6,
  CONFIRM: 7
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

const trashcanLeftBound = 268; 
const trashcanUpperBound = 375;
const trashcanWidth = 64;
const trashcanHeight = 64;

const captureError = "Oh no! It looks we failed to capture the image. This can happen when you open the extension but navigate away from this tab momentarily. No worries, close and reopen this extension and try again."

const alertError = (error) => {
  document.getElementById("error").style.display = "flex"
  document.getElementById("error-text").innerHTML = error;
}

const setupListeners = () => {

  chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      console.log("I'm popup js and I'm doing a thing")
      if(request.message === "loaded"){
        console.log("SUCCESS");
        url = request.url;
        bindImg(request.savedImage)
        sendResponse({message: "thanks!"});
      } else if (request.message === "error"){
        alertError(captureError);
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

const setupThreejs = () => {
  threejsinit(canvas, url);
  threejsanimate();
}
const greetingMappings = {
  missu: ["I'm vacationing at", "What about you?"],
  blast: ["Having a blast at", "Come join me!"],
  greetingsfrom: ["Greetings from", "Wish you were here!"]
}

var greetingRadioButtons = document.greetingForm.greeting;
var prev = greetingRadioButtons[0];
for (var i = 0; i < greetingRadioButtons.length; i++) {
    greetingRadioButtons[i].addEventListener('change', function() {
        (prev) ? console.log(prev.value): null;
        if (this !== prev) {
            prev = this;
        }
        wishuTop.innerHTML = greetingMappings[this.value][0];
        wishuBottom.innerHTML = greetingMappings[this.value][1];

    });
}

let iconsList = [];

class DraggableIcon{

  constructor(type){
    this.down = false;
    this.pos1 = 0;
    this.pos2 = 0;
    this.pos3 = 0;
    this.pos4 = 0;
    this.createItem(type);
    this.elementDrag = this.elementDrag.bind(this);
    this.createItem = this.createItem.bind(this);
    this.closeDragElement = this.closeDragElement.bind(this);
    this.setupListeners = this.setupListeners.bind(this);
  }

  createItem(type){
    let ele = document.createElement("IMG");
    ele.src = "images/" + type + ".png";
    this.element = ele;
    movable.appendChild(ele);
    this.setupListeners(ele);
  }

  elementDrag(e){
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    this.pos1 = this.pos3 - e.clientX;
    this.pos2 = this.pos4 - e.clientY;
    this.pos3 = e.clientX;
    this.pos4 = e.clientY;
    const y = this.element.offsetTop - this.pos2;
    const x = (this.element.offsetLeft - this.pos1);
    this.x = x;
    this.y = y;
    // set the element's new this.position:
    this.element.style.top = y + "px";
    this.element.style.left = x + "px";
    
    if(x > trashcanLeftBound 
      &&  x < trashcanLeftBound + trashcanWidth
      && y > trashcanUpperBound 
      && y < trashcanUpperBound + trashcanHeight){
        trashcan.classList.add("activated-trash");
        this.trash = true;
    } else {
      trashcan.classList.remove("activated-trash");
      this.trash = false;
    }
  }

  closeDragElement(){
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    trashcan.style.display = "none";
    if(this.trash){
      var index = iconsList.indexOf(this);
      if (index > -1) {
        iconsList.splice(index, 1);
      }
      this.element.remove();
    }
    
  }

  setupListeners(target){
    target.addEventListener("mousedown", (e) => {
      this.down = true;
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      this.pos3 = e.clientX;
      this.pos4 = e.clientY;
      document.onmouseup = this.closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = this.elementDrag;
      trashcan.style.display = "block";
    })
  }
}

document.querySelectorAll(".draggable-icons").forEach(item => {
  item.addEventListener("click", () => {
    iconsList.push(new DraggableIcon(item.id));
  })
  
})

decorateButton.addEventListener("click", () => {
  switchPhase();
})

preview.addEventListener("click", () => {
  data = validateForm();
  if(!data){
    alertError("Oh no! Please fill out all of the fields first :')");
    return;
  }
  switchPhase();
})

document.getElementById("dismiss-address-error").addEventListener("click", ()=>{
  document.getElementById("error").style.display = "none";
})

const setupDecorate= ()=>{
  imageContainer.style.display="none"
  decorateButton.style.display = "block";
  step.innerHTML = "Step 3";
  specific_instruction.innerHTML = "Decorate the postcard!";
  decorate.style.display="block";
  document.getElementById("bg-line").src = "../images/decorative_line_2.svg"
  document.getElementById("bg-line").style.width = "710px"
  document.getElementById("bg-line").style.left = "59.5px"
  setupThreejs();
  return (() => {
    decorate.style.display="none";
    decorateButton.style.display = "none";
    document.getElementById("bg-line").src = "../images/decorative_line.svg"
    document.getElementById("bg-line").style.removeProperty('width');
    document.getElementById("bg-line").style.removeProperty('left')
    threejsstop();
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
    case PHASES.ADDRESS:
      cleanupFunc = setupAddressPhase();
      break;
    case PHASES.PREVIEW:
      cleanupFunc = setupPreviewPhase();
      break;
    case PHASES.ORDER:
      cleanupFunc = setupOrderPhase();
      break;
    case PHASES.CONFIRM:
      cleanupFunc = setupConfirmPhase();
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
    if(wid/hei > postcardWidthStyle/postcardHeight){
      scaledWid = postcardWidthStyle;
      scaledHei = 1/aspectratio * postcardWidthStyle;
      newimg.style.width = `${scaledWid}px`
      newimg.style.height = `${scaledHei}px`
      imageContainer.style.width = `${scaledWid}px`
      imageContainer.style.height = `${scaledHei}px`
      scaleMode = SCALE_MODE.WIDTH;
      rectCutterHeight = scaledWid;
    } else {
      scaledHei = postcardHeightStyle;
      scaledWid = aspectratio * postcardHeightStyle;
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

  cropped = document.createElement("CANVAS");
  let ctx = cropped.getContext("2d");

  canvas = cropped;

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
  
  decorate.append(cropped);
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

const compile = () => {
  let ctx = compiler.getContext("2d");
  ctx.drawImage(cropped, 0, 0, postcardWidth, postcardHeight);
  ctx.drawImage(document.getElementById("threecanvas"), 0, 0, postcardWidth, postcardHeight);
  iconsList.forEach((item) => {
    ctx.drawImage(item.element, item.x * scalingRatio, item.y * scalingRatio, 50 * scalingRatio, 50 * scalingRatio);
  })
  ctx.font = "bold 102px Courgette";
  ctx.fillStyle = "red";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 10;
  const textWidth = ctx.measureText(greetingMappings[prev.value][1]).width;
  ctx.strokeText(greetingMappings[prev.value][0], 20 * scalingRatio, 40 * scalingRatio);
  ctx.fillText(greetingMappings[prev.value][0], 20 * scalingRatio, 40 * scalingRatio);
  ctx.strokeText(greetingMappings[prev.value][1], 570 * scalingRatio -textWidth, 390 * scalingRatio);
  ctx.fillText(greetingMappings[prev.value][1], 570 * scalingRatio - textWidth, 390 * scalingRatio);
  
}

const setupAddressPhase = ()=>{
  card.style.display = "block";
  backOfPostcard.style.display = "block";
  preview.style.display = "block";
  step.innerHTML = "Step 4";
  specific_instruction.innerHTML = "Add the info.";
  
  return (() => {
    preview.style.display = "none";
    card.classList.remove("flipped");
  })
}

const setupPreviewPhase = () => {
  compile();
  frontOfPostcard.style.display = "block";
  finalize.style.display = "block";
  card.classList.add("preview");
  step.innerHTML = "Step 5";
  specific_instruction.innerHTML = "Preview your card. Hover and click to flip.";
  return (() => {
    frontOfPostcard.style.display = "none";
    card.style.display = "none";
    finalize.style.display = "none";
  })
}

const setupOrderPhase = () => {
  step.innerHTML = "Step 6";
  specific_instruction.innerHTML = "Put in promo code and order!";
  document.getElementById("order-page").style.display = "block";
  document.getElementById("order").style.display = "block";
  return (() => {
    document.getElementById("order-page").style.display = "none";
    document.getElementById("order").style.display = "none";
  })
}

const setupConfirmPhase = () => {
  step.innerHTML = "Step 7";
  specific_instruction.innerHTML = "You're finished! Donations are appreciated, but not necessary!";
  document.getElementById("confirmation-page").style.display = "block";
  document.getElementById("homepage").style.display = "block";
  document.getElementById("confirmation-id").innerHTML = successfulResponse["printrecord"];
  document.getElementById("confirmation-date").innerHTML = successfulResponse["deliverydate"];
  document.getElementById("confirmation-pdf").href = successfulResponse["pdf"];
  document.getElementById("confirmation-cardsleft").innerHTML = successfulResponse["timesleft"];
  return (() => {
    document.getElementById("confirmation-page").style.display = "none";
    document.getElementById("homepage").style.display = "none";
  })
}

card.addEventListener("click", () => {
  if(currentPhase != PHASES.PREVIEW) return;
  card.classList.toggle("flipped");
})

finalize.addEventListener("click", () => {
  switchPhase();
})

order.addEventListener("click", ()=>{

  order.innerHTML = "Processing..."

  let promoFormatted = validatePromoCode();

  if(!promoFormatted){
    alertError("Fill out all of the promo code fields first!");
    return;
  }

  let blob = compiler.toDataURL("image/jpeg").split(';base64,')[1];
  console.log(blob);

  data["image"] = blob

  let apiurl = "http://127.0.0.1:8080/pingpong"
  //let apiurl = "https://stellar-chemist-310218.uc.r.appspot.com/pingpong"
  
  postData(apiurl, data)
  .then(response => {
    console.log("RESULT");
    if(response.status === "bad code"){
      //promo code was not correct
      alertError("Your promo code wasn't correct!");
      order.innerHTML = "Place order"
    } else if (response.status === "no more postcards"){
      //promo code was used up
      order.innerHTML = "Place order"
      alertError("Your code has been used up! Contact hello@internetpost.cards if you think this is a mistake.")
    } else if (response.status === "success"){
      successfulResponse = response;
      order.innerHTML = "Place order"
      switchPhase();
    } else {
      order.innerHTML = "Place order"
      alertError("Hmm... something went wrong. Contact hello@internetpost.cards if you think this is a mistake. The error is: " + response["message"]["Error"]["Message"]);
    }
  });
})

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

function validatePromoCode() {
  var promo1 = document.forms["promocode"]["promo1"].value;
  var promo2 = document.forms["promocode"]["promo2"].value;
  var promo3 = document.forms["promocode"]["promo3"].value;
  var promo4 = document.forms["promocode"]["promo4"].value;
  if (promo1 == null 
    || promo1 == ""
    || promo2 == null 
    || promo2 == ""
    || promo3 == null 
    || promo3 == ""
    || promo4 == null 
    || promo4 == ""){
      return false;
    }

  data["promocode"] = promo1 + "-" + promo2 + "-" + promo3 + "-" + promo4;
  return true;
}

function validateForm() {
  
  var r_name = document.forms["recipient"]["recipient name"].value;
  var r_address1 = document.forms["recipient"]["recipient address1"].value;
  var r_address2 = document.forms["recipient"]["recipient address2"].value;
  var r_city = document.forms["recipient"]["recipient city"].value;
  var r_state = document.forms["recipient"]["recipient state"].value;
  var r_zip = document.forms["recipient"]["recipient zip"].value;

  var s_name = document.forms["sender"]["sender name"].value;
  var s_address1 = document.forms["sender"]["sender address1"].value;
  var s_address2 = document.forms["sender"]["sender address2"].value;
  var s_city = document.forms["sender"]["sender city"].value;
  var s_state = document.forms["sender"]["sender state"].value;
  var s_zip = document.forms["sender"]["sender zip"].value;

  if (r_name == null 
    || r_name == ""
    || r_address1 == null 
    || r_address1 == ""
    || r_city == null 
    || r_city == ""
    || r_state == null 
    || r_state == ""
    || r_zip == null 
    || r_zip == ""
    || s_name == null 
    || s_name == ""
    || s_address1 == null 
    || s_address1 == ""
    || s_city == null 
    || s_city == ""
    || s_state == null 
    || s_state == ""
    || s_zip == null 
    || s_zip == "") {
    return false;
  }
  return {
    recipient: {
      name: r_name,
      address1: r_address1,
      address2: r_address2,
      state: r_state,
      city: r_city,
      zipcode: r_zip
    },
    sender: {
      name: s_name,
      address1: s_address1,
      address2: s_address2,
      state: s_state,
      city: s_city,
      zipcode: s_zip
    },
    promocode: "montana-west-salami-item",
    message: document.getElementById("messagebox").value
  }
}