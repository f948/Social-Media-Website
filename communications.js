var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var path = require("path");

var userData=[],webPages=[],points=[],alreadyPushed=[],titleIndex=[],indexed=[],descriptionIndex=[];
var i,j,k,pointsAwarded,webPageId=0,nameWithoutExtension,splitNameWithoutExtension=[],numPoints,webpagesSent=0,webPageDate,currentUsername,usernameValue;
var splitKeyword=[],webpageData=[];
var usernameExists=false,passwordExists=false,login=false,userExists=false,fileExist=false;
var hours,time,newKeyword,points,count,minutes;
const programFiles =["register.html","login.html","search.html","update.html","communications.js"];
const port = process.env.PORT || 60274;
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];




app.get('/', function (req, res) {
	
	res.sendfile("register.html");
});

app.get('/:file',function(req,res){
	
	

		
		if(programFiles.includes(req.params.file)){
		
			if(req.params.file == 'register.html'){
				res.sendfile("register.html");
			}
		
			else if(req.params.file == 'login.html'){
				res.sendfile("login.html");
			}
		
			else if(req.params.file == 'search.html'){
				res.sendfile("search.html");
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
	
	

});




// if connection is recieved through socket check for data being sent 
io.on('connection', function(socket) {
	
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
		points=[];
		alreadyPushed=[];
		
		for(i=0;i<=titleIndex.length-1;i++){
			
			for(j=0;j<=keyword.split(" ").length-1;j++){
				
				if(titleIndex[i].word == keyword.split(" ")[j]){
					
					for(k=0;k<=titleIndex[i].index.length-1;k++){
						
						if(alreadyPushed.includes(titleIndex[i].index[k][0].id)){
							
							for(m=0;m<=webpageData.length-1;m++){
								
								if(titleIndex[i].index[k][0].id == webpageData[m].id){
									
									webpageData[m].points+=titleIndex[i].index[k][1];
									break;
									
								}
							}
						}
						
						else if(!alreadyPushed.includes(titleIndex[i].index[k][0].id)){
							
							webpageData.push({webpage:titleIndex[i].index[k][0],id:titleIndex[i].index[k][0].id,points:titleIndex[i].index[k][1]});
							
							alreadyPushed.push(titleIndex[i].index[k][0].id);
						}
						
					}
					
				}
			}
		}
		
		for(i=0;i<=webpageData.length-1;i++){
			
			points.push(webpageData[i].points);
			
		}
		
		alreadyPushed=[];
		
		webpagesSent=0;
		
		points.sort();
		
		for(i=points.length-1;i>=0;i--){
			
			for(j=webpageData.length-1;j>=0;j--){
				
				if(webpageData[j].points == points[i] && webpagesSent<=50 && !alreadyPushed.includes(webpageData[j].id)){
					
					socket.emit("getTitleWebPage",webpageData[j].webpage);
					
					alreadyPushed.push(webpageData[j].id);
					
					webpagesSent++;
				}
			}
		}
	});
	

	
	socket.on("getDescriptionWebPages",function(keyword){
		
		webpageData=[];
		points=[];
		alreadyPushed=[];
		
		for(i=0;i<=descriptionIndex.length-1;i++){
			
			for(j=0;j<=keyword.split(" ").length-1;j++){
				
				if(descriptionIndex[i].word == keyword.split(" ")[j]){
					
					for(k=0;k<=descriptionIndex[i].index.length-1;k++){
						
						if(alreadyPushed.includes(descriptionIndex[i].index[k][0].id)){
							
							for(m=0;m<=webpageData.length-1;m++){
								
								if(descriptionIndex[i].index[k][0].id == webpageData[m].id){
									
									webpageData[m].points+=descriptionIndex[i].index[k][1];
									break;
									
								}
							}
						}
						
						else if(!alreadyPushed.includes(descriptionIndex[i].index[k][0].id)){
							
							webpageData.push({webpage:descriptionIndex[i].index[k][0],id:descriptionIndex[i].index[k][0].id,points:descriptionIndex[i].index[k][1]});
							
							alreadyPushed.push(descriptionIndex[i].index[k][0].id);
						}
						
					}
					
				}
			}
		}
		
		for(i=0;i<=webpageData.length-1;i++){
			
			points.push(webpageData[i].points);
			
		}
		
		alreadyPushed=[];
		
		webpagesSent=0;
		
		points.sort();
		
		for(i=points.length-1;i>=0;i--){
			
			for(j=webpageData.length-1;j>=0;j--){
				
				if(webpageData[j].points == points[i] && webpagesSent<=50 && !alreadyPushed.includes(webpageData[j].id)){
					
					socket.emit("getDescriptionWebPage",webpageData[j].webpage);
					
					alreadyPushed.push(webpageData[j].id);
					
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

			webpagesSent=0;
			
			for(i=webPages.length-1;i>=0;i--){
				
				if(webpagesSent<=50 && webPages[i].username == username){
					socket.emit("getUserWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
	});
	
	socket.on("sendWebPage",function(data){
			
			if(data.name != "NO FILE ATTACHMENT"){
				
				data.name=data.name.slice(12,data.name.length);
				
				fs.writeFile(webPageId.toString()+data.name, data.code, function (err) {
				
				});
			}
			

			data.date = new Date(data.date);
			
			if(data.date.getHours()+1 < 13){
				hours=data.date.getHours();
				time=" am";
			}
			
			else if(data.date.getHours()+1 >= 13){
				hours=data.date.getHours()-12;
				time=" pm";
			}
			
			if(data.date.getMinutes() < 10){
				minutes="0"+data.date.getMinutes();
			}
			
			else if(data.date.getMinutes() >= 10){
				minutes=data.date.getMinutes();
			}
			
			webPages.push({profileImg:data.profileImg,username:data.username,title:data.title,searchTitle:data.searchTitle,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,searchDescription:data.searchDescription,comments:"",dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+minutes+time,id:webPageId,deleted:false});
			
			updateIndex();
			
			io.sockets.emit("getWebPage",{profileImg:data.profileImg,username:data.username,title:data.title,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,comments:"",dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false});
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
		
		for(i=webPages.length-1;i>=webPages.length-20 && i>=0;i--){
			socket.emit("getRecentlyUploadedWebPage",webPages[i]);
	
		}
		
	});
	
	
	socket.on("deletePage",function(id){	
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id==id){
				
				fs.unlink(webPages[i].id.toString()+webPages[i].name, function (err) {
					
				});
				
				webPages[i].deleted=true;
				webPages[i].profileImg="";
				webPages[i].imageSrc="";
				webPages[i].username="";
				webPages[i].image="";
				webPages[i].name="";
				webPages[i].comments="";
				webPages[i].description="";
				webPages[i].code="";
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
	
	function updateIndex(){
		
		titleIndex=[];
		descriptionIndex=[];
		indexed=[];
		
		
		for(i=0;i<=webPages.length-1;i++){
			
			for(j=0;j<=webPages[i].searchTitle.split(" ").length-1;j++){
				
				count=0;
					
				for(k=0;k<=webPages[i].searchTitle.split(" ").length-1;k++){
						
					if(webPages[i].searchTitle.split(" ")[j].toLowerCase() == webPages[i].searchTitle.split(" ")[k].toLowerCase()){
							
						count++;
					}
				}
				
				if(count > 0){
				
					if(!indexed.includes(webPages[i].searchTitle.split(" ")[j])){
						titleIndex.push({word:webPages[i].searchTitle.split(" ")[j],index:[[webPages[i],count]]});
						indexed.push(webPages[i].searchTitle.split(" ")[j]);
					}
				
				
					else if(indexed.includes(webPages[i].searchTitle.split(" ")[j])){
					
						for(l=0;l<=titleIndex.length-1;l++){
						
							if(titleIndex[l].word == webPages[i].searchTitle.split(" ")[j]){
							
								titleIndex[l].index.push([webPages[i],count]);
							}
						}
					}
				}
			}
			
			indexed=[];
			
			for(j=0;j<=webPages[i].searchDescription.split(" ").length-1;j++){
				
				count=0;
					
				for(k=0;k<=webPages[i].searchDescription.split(" ").length-1;k++){
						
					if(webPages[i].searchDescription.split(" ")[j].toLowerCase() == webPages[i].searchDescription.split(" ")[k].toLowerCase()){
							
						count++;
					}
				}
				
				if(count > 0){
				
					if(!indexed.includes(webPages[i].searchDescription.split(" ")[j])){
						descriptionIndex.push({word:webPages[i].searchDescription.split(" ")[j],index:[[webPages[i],count]]});
						indexed.push(webPages[i].searchDescription.split(" ")[j]);
					}
				
				
					else if(indexed.includes(webPages[i].searchDescription.split(" ")[j])){
					
						for(l=0;l<=descriptionIndex.length-1;l++){
						
							if(descriptionIndex[l].word == webPages[i].searchDescription.split(" ")[j]){
							
								descriptionIndex[l].index.push([webPages[i],count]);
							}
						}
					}
				}
			}
		}
	}
	

	
http.listen(port, function() {
   console.log('listening on localhost'+port);
});