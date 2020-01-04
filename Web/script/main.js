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

function screenToUC(screenCoord){
	var cvPos = new vec3(canvas.getBoundingClientRect().left, canvas.getBoundingClientRect().top, 0);
	var cvSize = new vec3(canvas.clientWidth, canvas.clientHeight, 1);

	var uv = screenCoord.sub(cvPos).div(cvSize);

	return new vec3(uv.x * 2.0 - 1.0, -(uv.y * 2.0 - 1.0));
}

class TriangleStripModel {

	vertices = [-1, -1, 1, -1, -1, 1, 1, 1];
	bufferID;

	tex_id;

	positions;
	available;

	constructor(){
		this.bufferID = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferID);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.tex_id = gl.createTexture();
	}

	static asyncLoadTex(src, model){
		var image = new Image();
		image.src = src;
		image.addEventListener('load', function() {
			// Now that the image has loaded make copy it to the texture.
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, model.tex_id);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
			gl.generateMipmap(gl.TEXTURE_2D);
		});
	}

	loadTexture(src){
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex_id);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 0, 255, 255]));
 
		TriangleStripModel.asyncLoadTex(src, this);
	}

	static loadFromHTMLID(id) {
        var model = new TriangleStripModel();

        var s_src = document.getElementById(id).text;
        var lines = s_src.split("\n");

        model.positions = [];
		model.available = [];

        for (var i = 0; i < lines.length; ++i) {
			var line = lines[i];
			if(line.startsWith("Vertex")){
				var par = line.replace("Vertex(", "").replace(")", "").split(",");

				model.positions.push(new vec3(parseFloat(par[0].split("=")[1]), parseFloat(par[1].split("=")[1]), parseFloat(par[2].split("=")[1])));
				model.available.push(Math.random() > 0.5);
			}
        }

        console.log("Positions: "+model.positions);

        return model;
    }

    render(vertex_attrib_loc, shader_program) {
		for(var i=0;i<this.positions.length;++i){
			var pos = this.positions[i];

			gl.uniform3f(gl.getUniformLocation(shader_program, "v_position"), pos.x, pos.y, pos.z);

			var c = this.available[i] ? new vec3(0.1, 1.0, 0.1) : new vec3(1.0, 0.1, 0.1);
			gl.uniform3f(gl.getUniformLocation(shader_program, "v_color_mul"), c.x, c.y, c.z);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferID);
			gl.vertexAttribPointer(vertex_attrib_loc, 2, gl.FLOAT, false, 0, 0);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.tex_id);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
    }

	rayPositionIntersect(orig, dir){
		for(var i=0;i<this.positions.length;++i){
			var pos = this.positions[i];


		}

		return -1;
	}

}
class TriangleIndexedModel {
	
	vertices = [-1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0];
	uvs = [];
	indices = [0, 1, 2, 2, 3, 0];
	
	vertexBufferID;
	uvBufferID;
	indexBufferID;

	tex_id;

	constructor(){
		this.vertexBufferID = gl.createBuffer();
		this.uvBufferID = gl.createBuffer();
		this.indexBufferID = gl.createBuffer();

		this.tex_id = gl.createTexture();

        this.updateBufferData();
    }

	static asyncLoadTex(src, model){
		var image = new Image();
		image.src = src;
		image.addEventListener('load', function() {
			// Now that the image has loaded make copy it to the texture.
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, model.tex_id);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
			gl.generateMipmap(gl.TEXTURE_2D);
		});
	}

	loadTexture(src){
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex_id);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 0, 255, 255]));
 
		TriangleIndexedModel.asyncLoadTex(src, this);
	}

    updateBufferData() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferID);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBufferID);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferID);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);
    }

    static loadFromHTMLID(id) {
        var model = new TriangleIndexedModel();

        var s_src = document.getElementById(id).text;
        var lines = s_src.split("\n");

        model.vertices = [];
        model.indices = [];
		model.uvs = [];

        for (var i = 0; i < lines.length; ++i) {
			var line = lines[i];
            /*var args = lines[i].split(" ");
            if (args[args.length-4] == "v") {
                model.vertices.push(parseFloat(args[args.length-3]));
                model.vertices.push(parseFloat(args[args.length-2]));
                model.vertices.push(parseFloat(args[args.length-1]));
            }
			else if (args[args.length-3] == "vt") {
                model.uvs.push(parseFloat(args[args.length-2]));
                model.uvs.push(parseFloat(args[args.length-1]));
            }
            else if (args[args.length-4] == "f") {
                model.indices.push(parseInt(args[args.length-3].split("/")[0]));
                model.indices.push(parseInt(args[args.length-2].split("/")[0]));
                model.indices.push(parseInt(args[args.length-1].split("/")[0]));
            }*/
			if(line.startsWith("Vertex")){
				var par = line.replace("Vertex(", "").replace(")", "").split(",");
				model.vertices.push(parseFloat(par[0].split("=")[1]));
                model.vertices.push(parseFloat(par[1].split("=")[1]));
                model.vertices.push(parseFloat(par[2].split("=")[1]));
			}
			else if(line.startsWith("TexCoord")){
				var par = line.replace("TexCoord(", "").replace(")", "").split(",");
				model.uvs.push(parseFloat(par[0].split("=")[1]));
                model.uvs.push(parseFloat(par[1].split("=")[1]));
			}
			else if(line.startsWith("Face")){
				var par = line.replace(" ", "").replace("Face(", "").replace(")", "").split(",");
				model.indices.push(parseInt(par[0].split("=")[1]));
                model.indices.push(parseInt(par[1].split("=")[1]));
                model.indices.push(parseInt(par[2].split("=")[1]));
			}
        }

        console.log("Verts: "+model.vertices);
		console.log("UVs: "+model.uvs);
        console.log("Indices: "+model.indices);


        model.updateBufferData();

        return model;
    }

    render(vertex_attrib_loc, uv_attrib_loc) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferID);
        gl.vertexAttribPointer(vertex_attrib_loc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBufferID);
        gl.vertexAttribPointer(uv_attrib_loc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferID);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex_id);

        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
    }

}

class Renderer{

	mat_proj;
	mat_view;

	shader_program;
	poi_shader_program;

	invVPLoc;
    VMLoc;
	camPosLoc;
    PMLoc;
    f_arLoc;

    defaultModel;
	poiModel;
	 
	projectionMatrix;

	constructor(){
		canvas = document.querySelector("#gl_win");
		gl = canvas.getContext("webgl2");

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		}

		//init shaders
		var vssrc = document.getElementById("shader_vs").text;
		var fssrc = document.getElementById("shader_fs").text;

		var vs = this.createShader(gl.VERTEX_SHADER, vssrc);
		var fs = this.createShader(gl.FRAGMENT_SHADER, fssrc);

		this.shader_program = this.createProgram(vs, fs);
		this.poi_shader_program = this.createProgram(this.createShader(gl.VERTEX_SHADER, document.getElementById("shader_vs_poi").text), this.createShader(gl.FRAGMENT_SHADER, document.getElementById("shader_fs_poi").text));

		this.vertexAttribLocation = gl.getAttribLocation(this.shader_program, "vertex");
		this.uvAttribLocation = gl.getAttribLocation(this.shader_program, "uv");

		this.invVPLoc = gl.getUniformLocation(this.shader_program, "invVP");
        this.VMLoc = gl.getUniformLocation(this.shader_program, "viewMatrix");
        this.PMLoc = gl.getUniformLocation(this.shader_program, "projMatrix");
        this.f_arLoc = gl.getUniformLocation(this.shader_program, "f_ar");
		this.camPosLoc = gl.getUniformLocation(this.shader_program, "v_cam_pos");

        //this.defaultModel = new TriangleIndexedModel();
        this.defaultModel = TriangleIndexedModel.loadFromHTMLID("world_smf");
		this.defaultModel.loadTexture("./res/world_denoised.jpg");

		this.poiModel = TriangleStripModel.loadFromHTMLID("world_poi");
		this.poiModel.loadTexture("./res/poi.png");


        this.projectionMatrix = this.createProjectionMatrix(75.0, 0.1, 1000.0);
    }

    createProjectionMatrix(fov, near, far) {
        var scale = 1.0 / Math.tan(fov * 0.5 * Math.PI / 180.0);
        var ar = gl.canvas.height / gl.canvas.width;

        return new mat4(scale * ar, 0, 0, 0,
                        0, scale, 0, 0,
                        0, 0, -far / (far - near), -1,
                        0, 0, -far * near / (far - near), 0);
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

        this.projectionMatrix = this.createProjectionMatrix(75.0, 0.1, 1000.0);
	}

    onRender(cam_matrix, cam_pos) {

		gl.useProgram(this.shader_program);
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);

        gl.uniformMatrix4fv(this.invVPLoc, false, cam_matrix.data);
        gl.uniformMatrix4fv(this.VMLoc, false, cam_matrix.transpose().data);
        gl.uniformMatrix4fv(this.PMLoc, false, this.projectionMatrix.data);
		gl.uniform3f(this.camPosLoc, cam_pos.x, cam_pos.y, cam_pos.z);


		gl.uniform1f(this.f_arLoc,  gl.canvas.height /  gl.canvas.width);

		gl.enable(gl.DEPTH_TEST);

        this.defaultModel.render(0, 1);

		gl.disableVertexAttribArray(1);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		//render pois
		gl.useProgram(this.poi_shader_program);
		gl.enableVertexAttribArray(0);

		gl.uniformMatrix4fv(gl.getUniformLocation(this.poi_shader_program, "viewMatrix"), false, cam_matrix.transpose().data);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.poi_shader_program, "projMatrix"), false, this.projectionMatrix.data);
		gl.uniform3f(gl.getUniformLocation(this.poi_shader_program, "v_cam_pos"), cam_pos.x, cam_pos.y, cam_pos.z);

		this.poiModel.render(0, this.poi_shader_program);

		gl.disable(gl.BLEND);
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
		return new vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
	}
	div(vec){
		return new vec3(this.x / vec.x, this.y / vec.y, this.z / vec.z);
	}

	scale(val){
		return new vec3(this.x * val, this.y * val, this.z * val);
	}

	toGLVec(){
		return new vec3(this.x, this.z, -this.y);
	}

	mix(vec, vx, vy){
		return new vec3(this.x * vx + vec.x * vy, this.y * vx + vec.y * vy, this.z * vx + vec.z * vy);
	}

	add(vec){
		return this.mix(vec, 1, 1);
	}
	sub(vec){
		return this.mix(vec, 1, -1);
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

    transpose() {
        return new mat4(this.data[0], this.data[4], this.data[8], this.data[12],
                        this.data[1], this.data[5], this.data[9], this.data[13],
                        this.data[2], this.data[6], this.data[10], this.data[14],
                        this.data[3], this.data[7], this.data[11], this.data[15]);
    }

	invert(){
		var inv = math.inv([[this.data[0], this.data[1], this.data[2], this.data[3]],
						[this.data[4], this.data[5], this.data[6], this.data[7]],
						[this.data[8], this.data[9], this.data[10], this.data[11]],
						[this.data[12], this.data[13], this.data[14], this.data[15]]]);

		return new mat4(inv[0][0], inv[0][1], inv[0][2], inv[0][3], inv[1][0], inv[1][1], inv[1][2], inv[1][3], inv[2][0], inv[2][1], inv[2][2], inv[2][3], inv[3][0], inv[3][1], inv[3][2], inv[3][3]);
	}

	mul(mat){
		return new mat4(this.data[0] * mat.data[0] + this.data[1] * mat.data[4] + this.data[2] * mat.data[8] + this.data[3] * mat.data[12], this.data[0] * mat.data[1] + this.data[1] * mat.data[5] + this.data[2] * mat.data[9] + this.data[3] * mat.data[13], this.data[0] * mat.data[2] + this.data[1] * mat.data[6] + this.data[2] * mat.data[10] + this.data[3] * mat.data[14], this.data[0] * mat.data[3] + this.data[1] * mat.data[7] + this.data[2] * mat.data[11] + this.data[3] * mat.data[15],
						this.data[4] * mat.data[0] + this.data[5] * mat.data[4] + this.data[6] * mat.data[8] + this.data[7] * mat.data[12], this.data[4] * mat.data[1] + this.data[5] * mat.data[5] + this.data[6] * mat.data[9] + this.data[7] * mat.data[13], this.data[4] * mat.data[2] + this.data[5] * mat.data[6] + this.data[6] * mat.data[10] + this.data[7] * mat.data[14], this.data[4] * mat.data[3] + this.data[5] * mat.data[7] + this.data[6] * mat.data[11] + this.data[7] * mat.data[15],
						this.data[8] * mat.data[0] + this.data[9] * mat.data[4] + this.data[10] * mat.data[8] + this.data[11] * mat.data[12], this.data[8] * mat.data[1] + this.data[9] * mat.data[5] + this.data[10] * mat.data[9] + this.data[11] * mat.data[13], this.data[8] * mat.data[2] + this.data[9] * mat.data[6] + this.data[10] * mat.data[10] + this.data[11] * mat.data[14], this.data[8] * mat.data[3] + this.data[9] * mat.data[7] + this.data[10] * mat.data[11] + this.data[11] * mat.data[15],
						this.data[12] * mat.data[0] + this.data[13] * mat.data[4] + this.data[14] * mat.data[8] + this.data[15] * mat.data[12], this.data[12] * mat.data[1] + this.data[13] * mat.data[5] + this.data[14] * mat.data[9] + this.data[15] * mat.data[13], this.data[12] * mat.data[2] + this.data[13] * mat.data[6] + this.data[14] * mat.data[10] + this.data[15] * mat.data[14], this.data[12] * mat.data[3] + this.data[13] * mat.data[7] + this.data[14] * mat.data[11] + this.data[15] * mat.data[15]);
	}
}

class DeviceTransform{
	
	position;
	
	quaternion;
	mat_transform;

	constructor(){
		this.position = new vec3(0.0, 1.5, 0.0);
		this.alpha = 0.0;
		this.beta = 0.0;
		this.gamma = 0.0;
		
		this.updateOrientation([0.0, 1.0 / Math.sqrt(2),  1.0 / Math.sqrt(2), 0.0]);
	}

	updatePosition(pos){
		//this.position.x = pos.coords.latitude;
		//this.position.z = pos.coords.longitude;
	}

	updateOrientation(q){
		this.quaternion = q;

		const x = q[0];
		const y = q[1];
		const z = q[2];
		const w = q[3];

		//Use quaternion
		/*this.mat_transform = new mat4(1.0 - 2*y*y - 2*z*z, -(2*x*y+2*w*z), -(2*x*z-2*w*y), 0,
									  2*x*y-2*z*w, -(1.0-2*x*x-2*z*z), -(2*y*z+2*w*x), 0, 
									  2*x*z+2*w*y, -(2*y*z-2*w*x), -(1.0-2*x*x-2*y*y), 0,
									  0, 0, 0, 1.0);*/
		//Use GL coodinate system
		this.mat_transform = new mat4(-(1.0 - 2*y*y - 2*z*z), (2*x*z-2*w*y), (2*x*y+2*w*z), 0,
									  -(2*x*y-2*z*w), (2*y*z+2*w*x), (1.0-2*x*x-2*z*z), 0, 
									  -(2*x*z+2*w*y), (1.0-2*x*x-2*y*y), (2*y*z-2*w*x), 0,
									  0, 0, 0, 1.0);
		
	}

	getForward(){
		return this.mat_transform.transpose().transform(new vec3(0, 0, -1));
	}
	getRight(){
		return this.mat_transform.transpose().transform(new vec3(1, 0, 0));
	}
	getUp(){
		return this.mat_transform.transpose().transform(new vec3(0, 1, 0));
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

//Orientation quaternion
const options = { frequency: 60, referenceFrame: 'device' };
const sensor = new AbsoluteOrientationSensor(options);

sensor.addEventListener('reading', () => {
	dev_transform.updateOrientation(sensor.quaternion);
});
sensor.addEventListener('error', error => {
	if (event.error.name == 'NotReadableError') {
		alert("Sensor is not available.");
	}
});
sensor.start();
//-----------------------

if (navigator.geolocation) { 
	console.log("Device GPS Sensors active");

	var geoWatchID = navigator.geolocation.watchPosition(updateDevPosition, errorGeo, {enableHighAccuracy: true, maximumAge: 10000});
}
else{
	alert("No Device GPS Sensors active");
}

//-----------------------------------------

//------------ Touch Controls -------------
var touchPositionCache;
var touchStart;

canvas.addEventListener('touchstart', function(e) {
	var clientX = e.touches[0].clientX;
	var clientY = e.touches[0].clientY;

	touchPositionCache = new vec3(clientX, clientY, 0);
	touchStart = touchPositionCache;
}, false);
canvas.addEventListener('touchend', function(e) {
	var clientX = e.changedTouches[0].clientX;
	var clientY = e.changedTouches[0].clientY;

	if(Math.abs(clientX - touchStart.x) + Math.abs(clientY - touchStart.y) < 8){
		var uc = screenToUC(touchStart);

		var invVP = dev_transform.mat_transform.mul(main_renderer.projectionMatrix.invert());
		
		var rd = invVP.transform(new vec3(uc.x, uc.y, -1.0));

		alert(uc.x+" "+uc.y+" " + rd.x+" "+rd.y+" "+rd.z);
		//main_renderer.poiModel.rayPositionIntersect(dev_transform.position);
	}
}, false);

canvas.addEventListener('touchmove', function(e) {
	var clientX = e.changedTouches[0].clientX;
	var clientY = e.changedTouches[0].clientY;

	dev_transform.position = dev_transform.position.add(dev_transform.getUp().scale(-(clientY - touchPositionCache.y) * 0.01));

	//alert(dev_transform.position+" "+ clientY+" "+ touchPositionCache.y);

	touchPositionCache = new vec3(clientX, clientY, 0);

}, false);

//-----------------------------------------



function updateLoop(){
	//update debug text
	element_debug.innerHTML = "Debug: <br>[lat="+dev_transform.position.x+", long="+dev_transform.position.z+"] <br>[q="+ dev_transform.quaternion + "] <br>[F="+dev_transform.getForward().x+", "+dev_transform.getForward().y+", "+dev_transform.getForward().z+"] <br>[R="+dev_transform.getRight().x+", "+dev_transform.getRight().y+", "+dev_transform.getRight().z+"] <br>[U="+dev_transform.getUp().x+", "+dev_transform.getUp().y+", "+dev_transform.getUp().z+"]";
	
	//rendering
	main_renderer.onPrepare();
	main_renderer.onRender(dev_transform.mat_transform, dev_transform.position);

	//next frame
	requestAnimationFrame(updateLoop);
}

requestAnimationFrame(updateLoop);
