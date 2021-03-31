import * as THREE from './third_party/three.module.js';
import {
    SVGLoader
} from './third_party/SVGLoader.module.js';

THREE.Cache.enabled = true;

let container;

let camera, cameraTarget, scene, renderer;

let group, textMesh1, textGeo, materials, texture;

const fontPath = "../fonts/Erica_One_Regular.json"

let text = "dog.com",

    bevelEnabled = true,

    font = undefined;

const height = 20,
    size = 70,
    hover = 30,

    curveSegments = 4,

    bevelThickness = 2,
    bevelSize = 1.5;

let targetRotationX = 0;
let targetRotationXOnPointerDown = 0;
let targetRotationY = 0;
let targetRotationYOnPointerDown = 0;
let targetRotationZ = 0;
let targetRotationZOnPointerDown = 0;

let pointerX = 0;
let pointerY = 0;
let pointerZ = 0;

let lastsquish = 0.8;
let squish = 0.8;

let windowHalfX = window.innerWidth / 2;

var lastamp = 20.0;
var amp = 20.0;
var lastfreq = 60.0;
var freq = 60.0;
var shift = 0.5;

function init(canvas, url) {

    container = document.createElement('div');
    container.id = "threejs"
    text = url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0];
    document.getElementById("decoration-container").appendChild(container);

    // CAMERA
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
    camera.position.set(0, 400, 700);
    cameraTarget = new THREE.Vector3(0, 150, 0);

    // SCENE
    scene = new THREE.Scene();

    texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.005, 0.005);
    texture.anisotropy = 1;

    // LIGHTS
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
    dirLight.position.set(0, 0, 1).normalize();
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);

    materials = [
        new THREE.MeshBasicMaterial({
            map: texture
        }), // front
        new THREE.MeshPhongMaterial({
            color: 0xff0000
        }) // side
    ];

    group = new THREE.Group();
    group.position.y = 100;

    scene.add(group);

    loadFont();

    // RENDERER

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(600, 400);
    renderer.domElement.id="threecanvas";
    container.appendChild(renderer.domElement);

    // EVENTS

    //container.style.touchAction = 'none';
    window.addEventListener('resize', onWindowResize);
    console.log("adding event listenres");
    document.getElementById("random-rot").addEventListener("click", () => {
        targetRotationX = Math.random() - 0.5;
        //console.log(targetRotationX)
        targetRotationY = Math.random() - 0.5;
        targetRotationZ = Math.random() - 0.5;
        console.log(targetRotationZ);
    })
    // document.getElementById( 'yrot' ).addEventListener('input', onSliderMove);
    // document.getElementById( 'yrot' ).addEventListener('mousedown', onSliderDown);
    // document.getElementById( 'xrot' ).addEventListener('input', onSliderMove);
    // document.getElementById( 'xrot' ).addEventListener('mousedown', onSliderDown);
    // document.getElementById( 'zrot' ).addEventListener('input', onSliderMove);
    // document.getElementById( 'zrot' ).addEventListener('mousedown', onSliderDown);
    document.getElementById('amp').addEventListener('input', onSliderMove);
    document.getElementById('amp').addEventListener('mousedown', onSliderDown);
    document.getElementById('squish').addEventListener('input', onSliderMove);
    document.getElementById('squish').addEventListener('mousedown', onSliderDown);

}

function onWindowResize() {

    windowHalfX = 300;

    camera.aspect = 3 / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(600, 400);

}

function loadFont() {

    const loader = new THREE.FontLoader();
    loader.load(fontPath, function(response) {

        font = response;

        refreshText();

    });

}

function makeItWavy(textGeo) {
    console.log("making it wavy", amp);

    // var shapes = font.generateShapes(text, 120);
    // let stroke_vertices = [];

    // var geometry = new THREE.ShapeGeometry(shapes);
    // geometry.computeBoundingBox();
    // let xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    // var holeShapes = [];
    // for (var i = 0; i < shapes.length; i++) {
    //     var shape = shapes[i];
    //     if (shape.holes && shape.holes.length > 0) {
    //         for (var j = 0; j < shape.holes.length; j++) {
    //             var hole = shape.holes[j];
    //             holeShapes.push(hole);
    //         }
    //     }
    // }
    // shapes.push.apply(shapes, holeShapes);
    // var color = new THREE.Color(0x006699);
    // var style = SVGLoader.getStrokeStyle(3, color.getStyle());
    // var strokeText = new THREE.Group();
    // for (var i = 0; i < shapes.length; i++) {
    //     var shape = shapes[i];
    //     var points = shape.getPoints();
    //     var geometry = SVGLoader.pointsToStroke(points, style);
    //     stroke_vertices = stroke_vertices.concat(geometry.attributes.position.array);
    //     let downscale = 0.635;
    //     geometry.scale(squish * downscale, 1 * downscale, 1 * downscale);
    //     var strokeMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    //         color: 0xffffff
    //     }));
    //     strokeText.add(strokeMesh);
    // }
    // const firstChild = strokeText.children[0].geometry;
    // firstChild.computeBoundingBox();
    // const lastChild = strokeText.children[strokeText.children.length - 1].geometry;
    // lastChild.computeBoundingBox();
    // const centerOffset = -0.5 * (lastChild.boundingBox.max.x - firstChild.boundingBox.min.x);
    // for(var i = 0; i < strokeText.children.length; i++){
    //   const child = strokeText.children[i];
    //   child.position.x = centerOffset;
    //   child.position.y = hover + 5
    //   child.position.z = 36;
    // }

    

    // group.add(strokeText);

    // // console.log(stroke_vertices);
    // //textGeoBuf = textGeoBuf.fromGeometry( textGeo )

    // // console.log(strokeText);
    // // var amp = 20.0;
    // // var freq = 60.0;
    // // var shift = 0.5;
    // for (var i = 0; i < stroke_vertices.length; i++) {

    //     for (var j = 1; j < stroke_vertices[i].length; j = j + 3) {
    //         //console.log(stroke_vertices[i][j]);
    //         var vx = stroke_vertices[i][j - 1];
    //         stroke_vertices[i][j] += amp * Math.sin(vx / freq + shift);
    //     }
    // }

    let positionData = textGeo.getAttribute("position");
    let positionPoints = positionData.array;

    for (var i = 0; i < positionPoints.length; i += 3) {
        let x = positionPoints[i];
        positionPoints[i + 1] += amp * Math.sin(x / freq + shift);
    }
}

function createText() {

    textGeo = new THREE.TextGeometry(text, {
        font: font,
        size: size,
        height: height,
        curveSegments: curveSegments,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled
    });

    textGeo.scale(squish, 1, 1);

    textGeo.computeBoundingBox();

    makeItWavy(textGeo);
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

    textMesh1 = new THREE.Mesh(textGeo, materials);

    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    group.add(textMesh1);

}

function refreshText() {

    group.remove(textMesh1);

    createText();

}

function onSliderDown(event) {
    if (event.target.id === "xrot") {
        targetRotationXOnPointerDown = targetRotationX;
    } else if (event.target.id === "yrot") {
        targetRotationYOnPointerDown = targetRotationY;
    } else if (event.target.id === "zrot") {
        targetRotationZOnPointerDown = targetRotationZ;
    }
}

function onSliderMove(event) {
    if (event.target.id === "xrot") {
        pointerX = event.target.value;
        targetRotationX = targetRotationXOnPointerDown + pointerX * 0.02;
    } else if (event.target.id === "yrot") {
        pointerY = event.target.value;
        targetRotationY = targetRotationYOnPointerDown + pointerY * 0.02;
    } else if (event.target.id === "zrot") {
        pointerZ = event.target.value;
        targetRotationZ = targetRotationYOnPointerDown + pointerZ * 0.02;
    } else if (event.target.id === "amp") {
        amp = event.target.value;
    } else if (event.target.id === "freq") {
        freq = event.target.value;
    } else {
        squish = event.target.value;
    }
}

//

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;
    group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;
    group.rotation.z += (targetRotationZ - group.rotation.z) * 0.05;

    //group.scale.z += ( targetRotationZ - group.rotation.z ) * 0.05;

    if (textGeo && (lastamp != amp || lastsquish != squish || lastfreq != freq)) {
        lastamp = amp;
        lastfreq = freq;
        makeItWavy(textGeo);
        refreshText();
    }

    camera.lookAt(cameraTarget);

    renderer.clear();
    renderer.render(scene, camera);

}

export {
    init,
    animate
}