//------- Renderer Variables because i hate the syntax of JS class Variables --------------
var canvas;
var gl;
//------------------------------------------------------------------------------

class Renderer{

	constructor(){
		canvas = document.querySelector("#gl_win");
		gl = canvas.getContext("webgl");

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		}
	}

	onPrepare(){
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	onRender(){
		
	}

}

class vec2{
	constructor(x, y){
		 this.x = x;
		 this.y = y;
	}
}

class DeviceTransform{
	
	position;

	constructor(){
		this.position = new vec2(0.0, 0.0);

		if (window.DeviceOrientationEvent) {
			console.log("Device Orientation Sensors active");
		}
		else{
			alert("No Device Orientation Sensors active");
		}

		if (navigator.geolocation) { 
			console.log("Device GPS Sensors active");
		}
		else{
			alert("No Device GPS Sensors active");
		}
	}

	updatePosition(pos){
		this.position.x = pos.coords.latitude;
		this.position.y = pos.coords.longitude;
	}
	
}

//-------------------------------------------------------------------------------
// Move to another file
var element_debug = document.getElementById("Debug");

var main_renderer = new Renderer();

var dev_transform = new DeviceTransform();

//---------BECAUSE JS IS CRAP--------------
function updateDevPosition(pos){
	dev_transform.updatePosition(pos);
}
function errorGeo(errorObj){
	alert("GPS Error: "+errorObj.message);
}

var geoWatchID = navigator.geolocation.watchPosition(updateDevPosition, errorGeo, {enableHighAccuracy: true, maximumAge: 10000});
//-----------------------------------------

function updateLoop(){
	//update debug text
	element_debug.innerHTML = "Debug: [long="+dev_transform.position.x+", lat="+dev_transform.position.y+"]";
	
	//rendering
	main_renderer.onPrepare();
	main_renderer.onRender();

	//next frame
	requestAnimationFrame(updateLoop);
}

requestAnimationFrame(updateLoop);