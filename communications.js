
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var path = require("path");

var userData=[],webPages=[],points=[];
var i,j,k,pointsAwarded,webPageId=0,connectedUsers=0,nameWithoutExtension,splitNameWithoutExtension=[],numPoints,webpagesSent=0,webPageDate,currentUsername,usernameValue,fileName;
var splitKeyword=[],webpageData=[];
var usernameExists=false,passwordExists=false,login=false,userExists=false,fileExist=false;
const programFiles =["register.html","login.html","web.html","update.html","communications.js"];
const port = process.env.PORT || 3000;


app.get('/', function (req, res) {
	
	if(connectedUsers<50){
		
		res.sendfile("register.html");
	}
	
	else if(connectedUsers>=50){
		res.send("Too many connected users");
	}
});

app.get('/:file',function(req,res){
	
	
	if(connectedUsers<50){
		
		if(programFiles.includes(req.params.file)){
		
			if(req.params.file == 'register.html'){
				res.sendfile("register.html");
			}
		
			else if(req.params.file == 'login.html'){
				res.sendfile("login.html");
			}
		
			else if(req.params.file == 'web.html'){
				res.sendfile("web.html");
			}
		
			else if(req.params.file == 'update.html'){
				res.sendfile("update.html");
			}
			
			else{
				res.send("File does not exist");
			}
			
		
		}
	
		else if(!programFiles.includes(req.params.file)){
		
			for(i=0;i<=webPages.length-1;i++){
			
				if(webPages[i].id.toString()+webPages[i].name == req.params.file){
					fileExist=true;
				
				}
			
			}
		
			if(fileExist){
				res.sendfile(req.params.file);
			}
		
			else if(!fileExist){
				res.send("File does not exist");
			}
		
			fileExist=false;
		}
	}
	
	else if(connectedUsers>=50){
		res.send("Too many connected users");
	}
});




// if connection is recieved through socket check for data being sent 
io.on('connection', function(socket) {
	
	connectedUsers++;
	
	socket.on("disconnect",function(){
		connectedUsers--;
	});
	
	socket.on("validateRegisterInfo",function(data){
		
		usernameExists=false;
		passwordExists=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username){
				usernameExists=true;
			}
			if(userData[i].password == data.password){
				passwordExists=true;
			}
		}
		
		socket.emit("isRegisterInfoNew",{usernameStatus:usernameExists,passwordStatus:passwordExists});

	});
	
	socket.on("register",function(data){
		userData.push({username:data.username,password:data.password,profileImg:'<img width="100" height="100" onerror="invalidProfileImage()"id="profile" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm_kVdMwEYyU95pNWTknAUfKokV1owQDTaVA&usqp=CAU">'});

	});
	
	socket.on("validateLoginInfo",function(data){
		
		login=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.username && userData[i].password==data.password){
				login=true;
			}
		}
		
		socket.emit("login",login);
	});
	
	socket.on("checkUser",function(data){
		
		registered=false;
		usernameValue="";
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username && userData[i].password == data.password){
				usernameValue=userData[i].username;
				registered=true;
			}
		}

		socket.emit("userRegistered",{username:usernameValue,isRegistered:registered});
	});
	
	
	socket.on("update",function(data){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.oldUsername && userData[i].password==data.oldPassword){
				userData[i].username=data.newUsername;
				userData[i].password=data.newPassword;
			}
		}
	});
	
	socket.on("getWebPages",function(){
		
		webpagesSent=0;
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webpagesSent <=50){
				io.sockets.emit("getWebPage",webPages[i]);
				
				webpagesSent++;
			}
		}
	});
	
	socket.on("getTitleWebPages",function(keyword){
		
		webpageData=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=keyword.length-1 && k<=webPages[i].title.length-1;j++,k++){
				
				if(webPages[i].title[k] == keyword[j]){
					pointsAwarded++;
				}
			}
			
			webpageData.push({title:webPages[i].title,points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=webPages[i].title.split(" ").length-1;j++,k++){
				
				if(webPages[i].title.split(" ").includes(splitKeyword[j])){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				else if(!webPages[i].title.split(" ").includes(splitKeyword[j])){
					pointsAwarded--;
				}
				
				if(webPages[i].title.split(" ")[k] == splitKeyword[j]){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				
			}
			
			webpageData[i].points+=pointsAwarded;
		}
		
		webpagesSent=0;
		
		for(numPoints=1000;numPoints>0;numPoints--){
			
			
			for(i=0;i<=webpageData.length-1;i++){
				
				if(webpageData[i].points == numPoints && webpagesSent<=50){
					socket.emit("getTitleWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
		}
		
	});
	
	socket.on("getFileWebPages",function(keyword){
		
		webpageData=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=keyword.length-1 && k<=webPages[i].name.length-1;j++,k++){
				
				if(webPages[i].name[k] == keyword[j]){
					pointsAwarded++;
				}
			}
			
			webpageData.push({name:webPages[i].name,points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=webPages[i].name.split(" ").length-1;j++,k++){
				
				if(webPages[i].name.split(" ").includes(splitKeyword[j])){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				else if(!webPages[i].name.split(" ").includes(splitKeyword[j])){
					pointsAwarded--;
				}
				
				if(webPages[i].name.split(" ")[k] == splitKeyword[j]){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				
			}
			
			webpageData[i].points+=pointsAwarded;
		}
		
		webpagesSent=0;
		
		for(numPoints=1000;numPoints>0;numPoints--){
			
			
			for(i=0;i<=webpageData.length-1;i++){
				
				if(webpageData[i].points == numPoints && webpagesSent<=50){
					socket.emit("getFileWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
		}
		
	});
	
	socket.on("getDescriptionWebPages",function(keyword){
		
		webpageData=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=keyword.length-1 && k<=webPages[i].description.length-1;j++,k++){
				
				if(webPages[i].description[k] == keyword[j]){
					pointsAwarded++;
				}
			}
			
			webpageData.push({description:webPages[i].description,points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=webPages[i].description.split(" ").length-1;j++,k++){
				
				if(webPages[i].description.split(" ").includes(splitKeyword[j])){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				else if(!webPages[i].description.split(" ").includes(splitKeyword[j])){
					pointsAwarded--;
				}
				
				if(webPages[i].description.split(" ")[k] == splitKeyword[j]){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				
			}
			
			webpageData[i].points+=pointsAwarded;
		}
		
		webpagesSent=0;
		
		for(numPoints=1000;numPoints>0;numPoints--){
			
			
			for(i=0;i<=webpageData.length-1;i++){
				
				if(webpageData[i].points == numPoints && webpagesSent<=50){
					socket.emit("getDescriptionWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
		}
		
	});
	
	socket.on("sendImageDataURL",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id.toString()+webPages[i].name == file){
				socket.emit("getImageDataURL",{name:webPages[i].name,URL:webPages[i].code});
			}
			
		}
	});
	
	
	socket.on("webPageViewed",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id.toString()+webPages[i].name == file){
				
				webPages[i].views++;
			}
			
		}
	});
	
	
	socket.on("getProfileImage",function(username){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == username){
				socket.emit("sendProfileImage",userData[i].profileImg);
			}
		}
	});
	
	socket.on("updateProfileImage",function(data){
		

		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username){
				userData[i].profileImg=data.profileImg;
			
			}
		}
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].username == data.username){
				webPages[i].profileImg=data.profileImg;
			}
		}
		
	});
	
	socket.on("getUserWebPages",function(username){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == username){
				userExists=true;
				
			}
		}
		
		if(userExists){
			
			webpagesSent=0;
			
			for(i=webPages.length-1;i>=0;i--){
				
				if(webpagesSent<=50 && webPages[i].username == username){
					socket.emit("getUserWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
		}
		
		else if(!userExists){
			
			socket.emit("userNotExist",username);
			
		}
		
		userExists=false;
		
	});
	
	socket.on("sendWebPage",function(data){
			
			if(data.name != "FILE WAS NOT SENT WITH THIS POST"){
				
				fileName = path.basename(data.name);
				
				fs.writeFile(webPageId.toString()+fileName, data.code, function (err) {
				
				});
			}
			
			else if(data.name == "FILE WAS NOT SENT WITH THIS POST"){
				fileName="FILE WAS NOT SENT WITH THIS POST";
			}
			
			webPages.push({profileImg:data.profileImg,username:data.username,title:data.title,image:data.image,name:fileName,code:data.code,description:data.description,comments:"",views:0,date:data.date,id:webPageId,deleted:false});
			io.sockets.emit("getWebPage",{profileImg:data.profileImg,username:data.username,title:data.title,image:data.image,name:fileName,code:data.code,description:data.description,comments:"",views:0,date:data.date,id:webPageId,deleted:false});
			webPageId++;
			
	});
	
	socket.on("sendComments",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].id.toString()+webPages[i].name == file){
				socket.emit("getComments",webPages[i].comments);
			}
		}
	});
	
	socket.on("addComment",function(data){
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].id.toString()+webPages[i].name == data.file){
				
				if(data.comment == ""){
					webPages[i].comments+="";
				}
				
				else if(data.comment !=""){
					webPages[i].comments+=data.comment+"~"+"~";
				}
			}
		}
	});
	
	socket.on("getRecentlyUploadedWebPages",function(){
		
		webpageData=[];
		points=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			numPoints=0;
			
			webPageDate = new Date(webPages[i].date);
			
			numPoints+=webPageDate.getFullYear()*8760;
			numPoints+=webPageDate.getMonth()*730;
			numPoints+=webPageDate.getHours();
			numPoints+=webPageDate.getMinutes()*1/60;
			numPoints+=webPageDate.getSeconds()*1/3600;
			
			webpageData.push({webpage:webPages[i],points:numPoints,sent:false});
			points.push(numPoints);
		}
		
		points.sort(function(a, b){return b - a});
		
		webpagesSent=0;
		
		for(i=0;i<=points.length-1;i++){
			for(j=0;j<=webpageData.length-1;j++){
					
				if(points[i] == webpageData[j].points && webpagesSent <=10 && !webpageData[j].sent){
					socket.emit("getRecentlyUploadedWebPage",webpageData[j].webpage);
					
					webpageData[j].sent=true;
					webpagesSent++;
					
				}
				
			}
			
		}
	});
	
	
	socket.on("deletePage",function(id){	
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id==id){
				
				fs.unlink(webPages[i].id.toString()+webPages[i].name, function (err) {
					
				});
				
				webPages[i].deleted=true;
				webPages[i].username="";
				webPages[i].image="";
				webPages[i].name="";
				webPages[i].comments="";
				webPages[i].description="";
				webPages[i].code="";
				webPages[i].views=0;
			}
		}

	});
	
	socket.on("change",function(usernames){
	
		for(i=0;i<=webPages.length-1;i++){

			if(webPages[i].username == usernames.oldUsername){
				webPages[i].username=usernames.newUsername;
				
			}
			
		}
		
	});
	
});

	
http.listen(port, function() {
   console.log('listening on localhost'+port);
});