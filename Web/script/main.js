//------- Renderer Variables because i hate the syntax of JS class Variables --------------
var canvas;
var gl;
//------------------------------------------------------------------------------

function toRadiant(deg){
	return Math.PI * 2.0 * deg / 360.0;
}

class TriangleStripModel {

	vertices = [-1, -1, 1, -1, -1, 1, 1, 1];
	bufferID;

	constructor(){
		this.bufferID = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferID);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	}

}

class Renderer{

	mat_proj;
	mat_view;

	shader_program;
	vertexAttribLocation;

	defaultModel;

	constructor(){
		canvas = document.querySelector("#gl_win");
		gl = canvas.getContext("webgl");

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		}

		//init shaders
		var vssrc = document.getElementById("shader_vs").text;
		var fssrc = document.getElementById("shader_fs").text;

		var vs = this.createShader(gl.VERTEX_SHADER, vssrc);
		var fs = this.createShader(gl.FRAGMENT_SHADER, fssrc);

		this.shader_program = this.createProgram(vs, fs);
		this.vertexAttribLocation = gl.getAttribLocation(this.shader_program, "vertex");

		this.defaultModel = new TriangleStripModel();
	}

	createShader(type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) {
		return shader;
		}
 
		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	}

	createProgram(vertexShader, fragmentShader) {
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (success) {
			return program;
		}
 
		alert(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
	}

	onPrepare(){
		gl.canvas.width = canvas.clientWidth;
		gl.canvas.height = canvas.clientHeight;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	onRender(){
		gl.useProgram(this.shader_program);
		gl.enableVertexAttribArray(this.vertexAttribLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultModel.bufferID);
		gl.vertexAttribPointer(this.vertexAttribLocation, 2, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

}

class vec2{
	constructor(x, y){
		 this.x = x;
		 this.y = y;
	}
}
class vec3{
	constructor(x, y, z){
		 this.x = x;
		 this.y = y;
		 this.z = z;
	}

	mul(vec){
		return new vec3(this.x * x, this.y * y, this.z * z);
	}
}

class DeviceTransform{
	
	position;
	
	alpha;
	beta;
	gamma;

	constructor(){
		this.position = new vec2(0.0, 0.0);
		this.alpha = 0.0;
		this.beta = 0.0;
		this.gamma = 0.0;
	}

	updatePosition(pos){
		this.position.x = pos.coords.latitude;
		this.position.y = pos.coords.longitude;
	}

	updateOrientation(alpha, beta, gamma){
		this.alpha = alpha;
		this.beta = beta;
		this.gamma = gamma;
	}

	getForward(){
		return new vec3(-Math.sin(toRadiant(this.alpha)) * Math.cos(toRadiant(this.beta)), Math.cos(toRadiant(this.alpha)) * Math.cos(toRadiant(this.beta)), Math.sin(toRadiant(this.beta)));
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
function updateOrientation(event){
	dev_transform.updateOrientation(event.alpha, event.beta, event.gamma);
}


if (window.DeviceOrientationEvent) {
	console.log("Device Orientation Sensors active");

	window.addEventListener("deviceorientation", updateOrientation, true);
}
else{
	alert("No Device Orientation Sensors active");
}

if (navigator.geolocation) { 
	console.log("Device GPS Sensors active");

	var geoWatchID = navigator.geolocation.watchPosition(updateDevPosition, errorGeo, {enableHighAccuracy: true, maximumAge: 10000});
}
else{
	alert("No Device GPS Sensors active");
}

//-----------------------------------------

function updateLoop(){
	//update debug text
	element_debug.innerHTML = "Debug: [lat="+dev_transform.position.x+", long="+dev_transform.position.y+"] [alpha="+dev_transform.alpha+", beta="+dev_transform.beta+", gamma="+dev_transform.gamma+"] [F="+dev_transform.getForward().x+", "+dev_transform.getForward().y+", "+dev_transform.getForward().z+"]";
	
	//rendering
	main_renderer.onPrepare();
	main_renderer.onRender();

	//next frame
	requestAnimationFrame(updateLoop);
}

requestAnimationFrame(updateLoop);