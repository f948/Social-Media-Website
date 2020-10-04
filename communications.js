var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");

var userData=[],webPages=[];
var i,webPageId=0,connectedUsers=0;
var usernameExists=false,passwordExists=false,login=false,userExists=false,fileExist=false;
const programFiles =["register.html","login.html","web.html","update.html"];
const port = process.env.PORT || 3000

app.get('/', function (req, res) {
	res.sendfile("register.html");
});

app.get('/:file',function(req,res){
	
	if(programFiles.includes(req.params.file)){
		
		if(req.params.file == 'register.html'){
			res.sendfile("register.html");
		}
		
		else if(req.params.file == 'login.html'){
			
			if(connectedUsers<50){
				res.sendfile("login.html");
			}
			else if(connectedUsers>=50){
				res.send("Too many connected users");
			}
		}
		
		else if(req.params.file == 'web.html'){
			res.sendfile("web.html");
		}
		
		else if(req.params.file == 'update.html'){
			res.sendfile("update.html");
		}
		
	}
	
	else if(!programFiles.includes(req.params.file)){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].name == req.params.file){
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
		userData.push({username:data.username,password:data.password});

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
		
	socket.on("update",function(data){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.oldUsername && userData[i].password==data.oldPassword){
				userData[i].username=data.newUsername;
				userData[i].password=data.newPassword;
			}
		}
	});


	
	socket.on("getWebPages",function(){
		
		for(i=0;i<=webPages.length-1;i++){

			io.sockets.emit("getWebPage",webPages[i]);

		}
	});
	

	
	socket.on("doesFileExist",function(fileName){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].name == fileName){
				fileExist=true;
				
			}
			
		}
		
		if(programFiles.includes(fileName)){
			fileExist=true;
		}
		
		socket.emit("fileExist",fileExist);
		
		fileExist=false;
	});
	
	socket.on("getUserWebPages",function(username){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == username){
				userExists=true;
				
			}
		}
		
		if(userExists){
			
			for(i=0;i<=webPages.length-1;i++){

				socket.emit("getWebPage",webPages[i]);

			}
		}
		
		else if(!userExists){
			
			socket.emit("userNotExist",username);
			
		}
		
		userExists=false;
		
	});
	
	socket.on("sendWebPage",function(data){
			
			fs.appendFile(data.name, data.code, function (err) {
				
			});
			
			webPages.push({username:data.username,image:data.image,name:data.name,code:data.code,message:data.message,date:data.date,id:webPageId,deleted:false});
			io.sockets.emit("getWebPage",{username:data.username,image:data.image,name:data.name,code:data.code,message:data.message,date:data.date,id:webPageId,deleted:false});
			webPageId++;

	});
	
	socket.on("deletePage",function(id){	
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id==id){
				
				webPages[i].deleted=true;
				webPages[i].name="";
				
				fs.unlink(webPages[i].name, function (err) {

				});
				
				
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