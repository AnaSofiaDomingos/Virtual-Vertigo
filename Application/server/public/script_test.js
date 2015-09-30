 /* ------------------------------------------------------------------------------------
 file : script.js
 author : António Domingos Ana Sofia
 project : Virtual-Vertigo
 date : hepia Spring 2015
 description : Script interacting with the 3D scene 
  ------------------------------------------------------------------------------------- */

var ip = "192.168.43.138"; //"129.194.184.145"; // localhost pc
var DIV_DISTANCE = 0.1;
var SCALE_SIZE = 100;
var MAX_Z = 5;
var REAL = 1;

var position = {};
var init = true;
var timer = 5;
var timerView = 10;
var start = false;
var runtime = null;
var rtLeft, rtRight;
var lastW, lastH;


// json of configuration
var json_config = {
	"skeleton_color" : "black", // black or white
	"pos_camera_pc" : 1 // 1 : on the CardBoard or 2 : behind the character
}


// json with all the related members for the animation 
var relatedMembers = [
	{ "id" : "SCSL" , "A" : "shouldercenter",   "B" : "shoulderleft"},
	{ "id" : "SEL" ,  "A" : "shoulderleft",  	"B" : "elbowleft"},
	{ "id" : "EWL" ,  "A" : "elbowleft",  		"B" : "wristleft"},
	{ "id" : "WHL" ,  "A" : "wristleft",  		"B" : "handleft"},
	{ "id" : "HESC" , "A" : "head",  			"B" : "shouldercenter"},
	{ "id" : "SCSR" , "A" : "shouldercenter",   "B" : "shoulderright"},
	{ "id" : "SER" ,  "A" : "shoulderright",    "B" : "elbowright"},
	{ "id" : "EWR" ,  "A" : "elbowright",  		"B" : "wristright"},
	{ "id" : "WHR" ,  "A" : "wristright",  		"B" : "handright"},
	{ "id" : "SCS" ,  "A" : "shouldercenter",  	"B" : "spine"},
	{ "id" : "SHC" ,  "A" : "spine",  			"B" : "hipcenter"},
	{ "id" : "HCHR" , "A" : "hipcenter",  		"B" : "hipright"},
	{ "id" : "HKR" ,  "A" : "hipright",  		"B" : "kneeright"},
	{ "id" : "KAR" ,  "A" : "kneeright",  		"B" : "ankleright"},
	{ "id" : "AFR" ,  "A" : "ankleright",  		"B" : "footright"},
	{ "id" : "HCHL" , "A" : "hipcenter",  		"B" : "hipleft"},
	{ "id" : "HKL" ,  "A" : "hipleft", 			"B" : "kneeleft"},
	{ "id" : "KAL" ,  "A" : "kneeleft",  		"B" : "ankleleft"},
	{ "id" : "AFL" ,  "A" : "ankleleft",  		"B" : "footleft"} ];	

// json with the joint type to map the id joint
var jointsType =[
	{"joint" : "hipcenter"},
	{"joint" : "spine"},
	{"joint" : "shouldercenter"},
	{"joint" : "head"},
	{"joint" : "shoulderleft"},
	{"joint" : "elbowleft"},
	{"joint" : "wristleft"},
	{"joint" : "handleft"},
	{"joint" : "shoulderright"},
	{"joint" : "elbowright"},
	{"joint"  : "wristright"},
	{"joint"  : "handright"},
	{"joint"  : "hipleft"},
	{"joint"  : "kneeleft"},
	{"joint"  : "ankleleft"},
	{"joint"  : "footleft"},
	{"joint"  : "hipright"},
	{"joint"  : "kneeright"},
	{"joint"  : "ankleright"},
	{"joint"  : "footright"}];

// prototype of function who permit to move the scene in function of the head
x3dom.fields.Quaternion.prototype.setFromEulerYXZ = function (alpha, beta, gamma) {

  var c1 = Math.cos( alpha / 2 );
  var c2 = Math.cos( beta / 2 );
  var c3 = Math.cos( gamma / 2 );
  var s1 = Math.sin( alpha / 2 );
  var s2 = Math.sin( beta / 2 );
  var s3 = Math.sin( gamma / 2 );

  this.x = s1 * c2 * c3 + c1 * s2 * s3;
  this.y = c1 * s2 * c3 - s1 * c2 * s3;
  this.z = c1 * c2 * s3 - s1 * s2 * c3;
  this.w = c1 * c2 * c3 + s1 * s2 * s3;
}

var MYAPP = {"deviceOrientation" : null, "viewpoint" : null};
onDeviceOrientationChangeEvent = (function(rawEvtData) {
  this.deviceOrientation = rawEvtData;
}).bind(MYAPP);

window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);

/*
 function to convert degrees to radians
 params : deg angle in degrees 
*/
function deg2rad(deg){return deg * (Math.PI / 180);}

 /*
  function to put the scene in fullscreen
  params : none
*/
function fullscreen() {
	container = document.getElementById("x3d");
	if (container.requestFullscreen) {
	    container.requestFullscreen();
	} else if (container.msRequestFullscreen) {
	    container.msRequestFullscreen();
	} else if (container.mozRequestFullScreen) {
	    container.mozRequestFullScreen();
	} else if (container.webkitRequestFullscreen) {
	    container.webkitRequestFullscreen();
	}
}

/*
 function sleep for the displays
 params : delay val of the time to sleep 
 */
function sleep(delay) {
	var start = new Date().getTime();
	while (new Date().getTime() < start + delay);
}


/*
function init to use the configuration json to change the color of the skeleton or
the position of the camera
params : none
*/
function init(){
	for (var i=0; i < jointsType.length; i++){
		$("#"+jointsType[i].joint).append("<appearance><material diffuseColor='"+json_config.skeleton_color+"'></material></appearance>");
	}
}


/*
 function for the load page 
 params : none 
*/
window.onload = function () {
	console.log(json_config);
    init();

	var character = $("#character");
	var vp = $("#vpp");
	var status = $("#status");
    status.text("Connecting to server...");
	 /* ------------------------------------------------------------------------------------
	  ------------------------ getting the informations of the kinect  ---------------------
	  ------------------------------------------------------------------------------------- */
    // Connect to server.
    var socket = io.connect('http://'+ ip +':3000');
    status.text("Connection successful.");

    /* 
    	function socket.io who receive positions FROM the server
    	params : json object json received from the server with the position of the joints
    */
    socket.on("dataKinect",function(json){
        status.text("Kinect data received.");

        for (var i = 0; i < json.length; i++){
        	for (var j=0; j < jointsType.length; j++){
        		// map the joint type to his name
        		if (json[i].JointType == j)
            		position[jointsType[j].joint] =  {"name" : jointsType[j].joint , "x" : json[i].Position.X.toFixed(3) * REAL, 
            											"y" : json[i].Position.Y.toFixed(3) * REAL, "z" :  json[i].Position.Z.toFixed(3)};
        	}
        }

        //console.log(position.head.z);

		animate();
        //draw();
        //startMoving();
    });

    /* 
    	function socket.io who receive orientation FROM the server
    	params : json object json received from the server with the orientation of the hands
    */
 	socket.on("boneOrientation", function(boneOrientation){
 		//var startjoint = jointsType[boneOrientation.start].joint;
 		var endjoint = jointsType[boneOrientation.end].joint;

 		// rotation of the thumb 
 		if (endjoint == 'handleft')
 			$("#thumbleft").attr("rotation", boneOrientation.rotation.X.toFixed(3) + " " + boneOrientation.rotation.Y.toFixed(3) + " " + boneOrientation.rotation.Z.toFixed(3) 
 			+ " " + boneOrientation.rotation.W.toFixed(3));
 		else if (endjoint == 'handright')
 			$("#thumbright").attr("rotation", boneOrientation.rotation.X.toFixed(3) + " " + boneOrientation.rotation.Y.toFixed(3) + " " + boneOrientation.rotation.Z.toFixed(3) 
 			+ " " + boneOrientation.rotation.W.toFixed(3));
 	});



	/* 
    	function socket.io who unction who permit to start the movements of the rigid character (not used anymore)
    	params : none
    */
    function startMoving(){
        for (var i = 0; i < position.length; i++) {

            // Move the character in fonction of the head
            if (position[i].name == "head"){
				if ((position[i].z > 3.93) && !start)
					start = true; 
            }

            if (start)
					moveCharacter();
            
        } 
    }


    /* 
    	function who display the data of the kinect in the canvas
 		params : none
 	*/
 	function draw(){
		var canvas = document.getElementById("canvas");
		var context = canvas.getContext("2d");

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();

     	jQuery.each(position, function() {
                if (this.name == "head"){
        			// Display the head on the canvas 
                    context.arc(parseFloat(this.x)*SCALE_SIZE, parseFloat(this.y) *SCALE_SIZE, (MAX_Z - this.z) * 10 , 0, 2 * Math.PI, false);
                    context.fill();
                }else{
                	// Display the rest of the skeleton joints on the canvas 
                	var size = (MAX_Z - this.z) * 5;
                    context.rect(parseFloat(this.x) *SCALE_SIZE, parseFloat(this.y) *SCALE_SIZE, size, size);
                    context.fill();
                }
            
        });
        
        context.closePath();
 	}

	 /* ------------------------------------------------------------------------------------
	  ------------------------ animating the character in the scene  -----------------------
	  ------------------------------------------------------------------------------------- */
	var jsonMembers = {};
	var old = {};

	/* 
    	function who animate and move the skeleton 
 		params : none
 	*/
    function animate(){

    	// create the skeleton and set the data received of the kinect
       jQuery.each(position, function() {
            var name = this.name;

           	$("#"+name).attr("translation",  position[name].x  + " " + position[name].y + " " +  position[name].z);
        });

        // relate the members
        for (var k=0; k<relatedMembers.length; k++)
       		buildSkeleton(relatedMembers[k]);
       	
       	move();
    }

	/* 
    	function who create of all the skeleton
 		params : members joints related in the object json relatedMembers
 	*/ 
    function buildSkeleton(members){
        if ((position[members.A] != undefined) & (position[members.B] != undefined)){
			old[members.id] = {"distance" : null, "angle" : null}
			jsonMembers[members.id] = {
				"distance" : calcDistance(position[members.A], position[members.B]),
				"angle" : 	 calcAngle(position[members.A], position[members.B])
			}

			positionning(members.id, position[members.A]); 
        	old[members.id].distance =  scaling(members.id, jsonMembers[members.id].distance, old[members.id].distance); 
        	old[members.id].angle 	 =  anime(members.id, jsonMembers[members.id].angle, 	  old[members.id].angle);
        }
	}
	/* 
    	function who find the distance between 2 points on a cartesien plan
 		params : p1 joint A of the member related
 				 p2 joint B of the member related
 	*/  
    function calcDistance(p1, p2){
    	return Math.sqrt(Math.pow((p2.x - p1.x),2) + Math.pow((p2.y - p1.y),2));
    }

    /* 
    	function who find the angle between 2 points with te arctan2
 		params : A joint A of the member related
 				 A joint B of the member related
    	ref : http://www.w3schools.com/jsref/jsref_atan2.asp
 	*/ 
    function calcAngle(A, B){
    	return -Math.atan2(B.y - A.y, A.x- B.x);
    }

	/* 
    	function who  put the member in his right place in the skeleton
 		params : id identification on HTML of the members related 
 				 pos position of the member A related
 	*/ 
	function positionning(id, pos){
		$("#"+id).attr("translation", (pos.x) + " " +  (pos.y -0.5) + " " + pos.z);
	}

	/* 
    	function who   adapt the size of the membre dans rotate in fonction of the kinect
 		params : id identification on HTML of the members related 
 				 distance distance between the 2 related members
 				 old old distance between the 2 related members
 	*/ 
	function scaling(id, distance, old){
		var distance = distance.toFixed(2);

		if (distance != old){
			$("#"+id).attr("scale", distance  +" "+ DIV_DISTANCE + " " + DIV_DISTANCE );
			old = distance;
		}

		return old;
	}

	/* 
    	function who  animate the members of the character
 		params : id identification on HTML of the members related 
 				 angle angle between the 2 related members
 				 old old angle between the 2 related members
 	*/ 
	function anime(id, angle, old){
		var angle = angle.toFixed(2);
		if (angle != old){
			$("#"+id).attr("rotation", "0 0 1 " + angle);
			old = angle;
		}
		return old;
	}

	 /* ------------------------------------------------------------------------------------
	  ------------------------ move the character in the scene  ----------------------------
	  ------------------------------------------------------------------------------------- */
	/* 
    	function who fictitious advancement 
 		params : none 
 		 NOT USED ANY MORE
 	*/  
	function moveFictif(){
		timerView--;
		timer--;
		character.attr("translation", timer +' 20 2');
		vp.attr("position",'0 10 '+ timerView);
		vp.attr("centerOfRotation", '0 10 '+ timerView);

		if (timer <= -MAX_Z){
			timer = 5;
			timerView = 10;
		}

		sleep(1);
		moveFictif();
	}

	/* 
    	function who move the character in fonction of the position of the head
 		params : none 
 		 NOT USED ANY MORE
 	*/ 
	function moveCharacter(){
		// 									  doble the advancement			 		center the character  
		character.attr("translation", (-REAL * position.head.z) + " 12.3 " + (position.head.x + (SCALE_SIZE * REAL)));
		vp.attr("position", position.head.x + ' 21.30905 '+ (REAL * (position.head.z - REAL)));
		vp.attr("centerOfRotation", position.head.x + ' 21.30905 '+ (REAL * (position.head.z - REAL)));
		checkBoundries("character");
        sleep(1);
	}


	/* 
    	function who move the animated character in fonction of the head
 		params : none 
 	*/ 
	function move(){
		if (position.head != undefined)
			if ((position.head.z > 3.90 & !start) ){
				start = true; 
				document.getElementById('music').play();
			}
			else if (position.head.z < 0.70 & start)
				start = false;

		if (start){
			// only the all armature move, the animation of the member is not handle here
			vp.attr("position", (parseFloat(position.head.x) -0.2) + " " + (parseFloat(position.head.y) -0.2)+ " " + (parseFloat(position.head.z) -0.2));
			vp.attr("centerOfRotation", (parseFloat(position.head.x) -0.2) + " " + (parseFloat(position.head.y) -0.2)+ " " + (parseFloat(position.head.z) -0.2));
			$("#armature").attr("translation",  (parseFloat(position.head.z) - 4.0) + " 7.3 0");
			$("#camera").attr("translation", (parseFloat(position.head.z) - 4.0) + " 8 " + (parseFloat(position.head.x) -0.2) );
			checkBoundries();
		}
	}

	/* 
    	function who check if the character is out of the board
 		params : none 
 	*/  
	function checkBoundries(){
		if (((posLegL[0] >= 0.607) && (posLegR[0] >= 0.715)) || ((posLegL[0] <= -0.456) && (posLegR[0] <= -0.311))){
			if (start)
				died();
		}

		if (position.head.z <= 0.8){
			start = false;
			retry();
		}
	}

	/* 
    	function who permits to show the fall
 		params : none 
 	*/
	var timerDead = 6;
	function died(){
		start = false;

		// change the view to see the fall
		var fall = setInterval(function(){
				timerDead--;
				$("#camera").attr("translation","-2 "+ timerDead +" 0" );
		},300);
		
		setTimeout(function(){clearInterval(fall); retry();}, 300 * 7);
	}

	/* 
    	function who permits to retry
 		params : none 
 	*/
	function retry(){
		sleep(2000);

		vp.attr("position", "0 0 4");
		vp.attr("centerOfRotation", "0 0 4");
		$("#armature").attr("translation",  "0 7.3 0");
		$("#camera").attr("translation", "-2 8 0");
	}

	/* -------------------------------------------------------------------------------------
    ------------------ rotation in fonction of the head (smartphone) ----------------------
    ------------------------------------------------------------------------------------- */
  
	runtime = document.getElementById('x3d').runtime;
    rtLeft = document.getElementById('left');
    rtRight = document.getElementById('right');

    lastW = +runtime.getWidth();
    lastH = +runtime.getHeight();

    var hw = Math.round(lastW / 2);
    rtLeft.setAttribute('dimensions',  hw + ' ' + lastH + ' 4');
    rtRight.setAttribute('dimensions', hw + ' ' + lastH + ' 4');

    var element = document.getElementById("x3d");
    MYAPP.viewpoint = document.getElementById('vpp');

    element.runtime.exitFrame = function() {
        // check if screensize changed
        var w = +runtime.getWidth();
        var h = +runtime.getHeight();
        if (w != lastW || h != lastH){
            var half = Math.round(w / 2);
            rtLeft.setAttribute('dimensions',  half + ' ' + h + ' 4');
            rtRight.setAttribute('dimensions', half + ' ' + h + ' 4');
            lastW = w;
            lastH = h;
        }

        //handle device orientation change
        if(!MYAPP.deviceOrientation)
            return;
        var q0 = x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(0,0,1),-deg2rad(window.orientation)); // phone rotation offset
        var q = new x3dom.fields.Quaternion();
        q.setFromEulerYXZ(deg2rad(MYAPP.deviceOrientation.beta), deg2rad(MYAPP.deviceOrientation.alpha), -deg2rad(MYAPP.deviceOrientation.gamma));

        var q1 = new x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(1,0,0),-Math.PI/2); // device orientation points upwards. rotate down to camera orientation

        q = q.multiply(q1);
        q = q.multiply(q0);

        var orientation = q.toAxisAngle();

        MYAPP.viewpoint.setAttribute("orientation", orientation[0].x + " " + orientation[0].y + " " + orientation[0].z + " " + orientation[1]);
    	
    };
	
}