//------- Renderer Variables because i hate the syntax of JS class Variables --------------
var canvas;
var gl;
//------------------------------------------------------------------------------

function toRadiant(deg){
	return Math.PI * 2.0 * deg / 360.0;
}
function cos(deg){
	return Math.cos(toRadiant(deg));
}
function sin(deg){
	return Math.sin(toRadiant(deg));
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

	invVPLoc;

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

		this.invVPLoc = gl.getUniformLocation(this.shader_program, "invVP");

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

	onRender(cam_matrix){
		gl.useProgram(this.shader_program);
		gl.enableVertexAttribArray(this.vertexAttribLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultModel.bufferID);
		gl.vertexAttribPointer(this.vertexAttribLocation, 2, gl.FLOAT, false, 0, 0);

		gl.uniformMatrix4fv(this.invVPLoc, false, cam_matrix);

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

	toGLVec(){
		return new vec3(this.x, this.z, -this.y);
	}

	mix(vec, vx, vy){
		return new vec3(this.x * vx + vec.x * vy, this.y * vx + vec.y * vy, this.z * vx + vec.z * vy);
	}
}

class mat4{
	data;

	constructor(m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33){
		this.data = [m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33];
	}

	transform(vec){
		return new vec3(this.data[0] * vec.x + this.data[1] * vec.y + this.data[2] * vec.z + this.data[3], this.data[4] * vec.x + this.data[5] * vec.y + this.data[6] * vec.z + this.data[7], this.data[8] * vec.x + this.data[9] * vec.y + this.data[10] * vec.z + this.data[11]);
	}

	set(vec0, vec1, vec2){
		this.data[0] = vec0.x;
		this.data[4] = vec0.y;
		this.data[8] = vec0.z;

		this.data[1] = vec1.x;
		this.data[5] = vec1.y;
		this.data[9] = vec1.z;

		this.data[2] = vec2.x;
		this.data[6] = vec2.y;
		this.data[10] = vec2.z;
	}
}

class DeviceTransform{
	
	position;
	
	alpha;
	beta;
	gamma;
	mat_transform;

	constructor(){
		this.position = new vec2(0.0, 0.0);
		this.alpha = 0.0;
		this.beta = 0.0;
		this.gamma = 0.0;
		
		this.updateOrientation(0.0, 0.0, 0.0);
	}

	updatePosition(pos){
		this.position.x = pos.coords.latitude;
		this.position.y = pos.coords.longitude;
	}

	updateOrientation(alpha, beta, gamma){
		this.alpha = alpha;
		this.beta = beta;
		this.gamma = gamma;

		/*this.mat_transform = new mat4(cos(this.alpha) * cos(this.gamma), sin(this.gamma) * cos(this.alpha) + sin(this.alpha) * sin(this.beta), -sin(this.alpha) * cos(this.beta), 0,
									  -sin(this.gamma), cos(this.beta) * cos(this.gamma), sin(this.beta), 0,
									  sin(this.alpha) * cos(this.gamma), -sin(this.beta) * cos(this.alpha) + sin(this.alpha) * sin(this.gamma), cos(this.alpha) * cos(this.beta), 0,
									  0, 0, 0, 1);*/
		this.mat_transform = new mat4(cos(alpha), 0, -sin(alpha), 0, 
									  0.5 * (-cos(alpha + beta) + cos(beta - alpha)), cos(beta), 0.5 * (sin(alpha + beta) + sin(beta - alpha)), 0, 
									  0.5 * (sin(alpha + beta) - sin(beta - alpha)), -sin(beta), 0.5 * (cos(alpha + beta) + cos(beta - alpha)), 0,
									  0, 0, 0, 1);
		var fwd = this.getForward();
		var right = this.getRight();
		var up = this.getUp();

		this.mat_transform.set(right, up, fwd);
	}

	getForward(){
		return this.mat_transform.transform(new vec3(0, -1, 0));
	}
	getRight(){
		return this.mat_transform.transform(new vec3(1, 0, 0));
	}
	getUp(){
		return this.mat_transform.transform(new vec3(0, 0, 1));
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
	element_debug.innerHTML = "Debug: <br>[lat="+dev_transform.position.x+", long="+dev_transform.position.y+"] <br>[alpha="+dev_transform.alpha+", beta="+dev_transform.beta+", gamma="+dev_transform.gamma+"] <br>[F="+dev_transform.getForward().x+", "+dev_transform.getForward().y+", "+dev_transform.getForward().z+"] <br>[R="+dev_transform.getRight().x+", "+dev_transform.getRight().y+", "+dev_transform.getRight().z+"] <br>[U="+dev_transform.getUp().x+", "+dev_transform.getUp().y+", "+dev_transform.getUp().z+"]";
	
	//rendering
	main_renderer.onPrepare();
	main_renderer.onRender(dev_transform.mat_transform.data);

	//next frame
	requestAnimationFrame(updateLoop);
}

requestAnimationFrame(updateLoop);