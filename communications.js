var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var path = require("path");

var userData=[],webPages=[];
var webPageId=0;
var fileExist=false;
var titleIndex=[],descriptionIndex=[];

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
		
		var usernameExists=false;
		var passwordExists=false;
		
		var i;
		
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
		
		var login=false;
		
		var i;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.username && userData[i].password==data.password){
				login=true;
			}
		}
		
		socket.emit("login",login);
	});
	
	socket.on("checkUser",function(data){
		
		var registered=false;
		var usernameValue="";
		
		var i;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username && userData[i].password == data.password){
				usernameValue=userData[i].username;
				registered=true;
			}
		}

		socket.emit("userRegistered",{username:usernameValue,isRegistered:registered});
	});
	
	
	socket.on("update",function(data){
		
		var i;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.oldUsername && userData[i].password==data.oldPassword){
				userData[i].username=data.newUsername;
				userData[i].password=data.newPassword;
			}
		}
		
		for(i=0;i<=webPages.length-1;i++){

			if(webPages[i].username == data.oldUsername){
				webPages[i].username=data.newUsername;
				
			}
			
		}
	});
	
	socket.on("getWebPages",function(){
		
		var webpagesSent=0;
		var i;
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webpagesSent <=50){
				io.sockets.emit("getWebPage",webPages[i]);
				
				webpagesSent++;
			}
		}
	});
	
	socket.on("getTitleWebPages",function(keyword){
		
		var i,j,k,l,m;
		var webpageData=[];
		var points=[];
		var alreadyPushed=[];
		var words=[];
		
		var distinctKeyword=distinctArray(keyword.split(" "));
		
		for(i=0;i<=titleIndex.length-1;i++){
			
			for(j=0;j<=distinctKeyword.length-1;j++){
				
				if(titleIndex[i].word == distinctKeyword[j]){
					
					for(k=0;k<=titleIndex[i].index.length-1;k++){
						
						if(alreadyPushed.includes(titleIndex[i].index[k][0].id)){
							
							for(m=0;m<=webpageData.length-1;m++){
								
								if(titleIndex[i].index[k][0].id == webpageData[m].id){
									
									webpageData[m].points+=10-titleIndex[i].index[k][1];
									webpageData[m].count++;
									break;
									
								}
							}
						}
						
						else if(!alreadyPushed.includes(titleIndex[i].index[k][0].id)){
							
							webpageData.push({webpage:titleIndex[i].index[k][0],id:titleIndex[i].index[k][0].id,count:1,points:10-titleIndex[i].index[k][1]});
							
							alreadyPushed.push(titleIndex[i].index[k][0].id);
						}
					}
				}
			}
		}
		
		var searchString,searchTitleString,length,start,start2,count;
		
		for(i=0;i<=webpageData.length-1;i++){
			
			for(length=2;length<=keyword.split(" ").length-1 && length<=webpageData[i].webpage.searchTitle.split(" ").length-1;length++){
					
				for(start=0;start<=keyword.split(" ").length-1-(length-1);start++){
					
					count=0;
					
					for(start2=0;start2<=webpageData[i].webpage.searchTitle.split(" ").length-1-(length-1);start2++){
						
						searchString="";
					
						for(j=start;j<=start+length-1;j++){
							searchString+=keyword.split(" ")[j]+" ";
						}
					
						searchString=searchString.slice(0,searchString.length-1);
					
						searchTitleString="";
					
						for(j=start2;j<=start2+length-1;j++){
							searchTitleString+=webpageData[i].webpage.searchTitle.split(" ")[j]+" ";
						}
					
						searchTitleString=searchTitleString.slice(0,searchTitleString.length-1);
					
						if(searchString == searchTitleString){
							count++;
						}
					}
					
					webpageData[i].points+=length*(10-count);
				}
			}
		}
		
		
		
		for(i=0;i<=webpageData.length-1;i++){
			
			for(j=0;j<=webpageData[i].webpage.searchTitle.split(" ").length-1;j++){
				
				if(!keyword.split(" ").includes(webpageData[i].webpage.searchTitle.split(" ")[j])){
					webpageData[i].points--;
				}
			}
			
			if(webpageData[i].webpage.searchTitle == keyword){
				webpageData[i].points+=999;
			}
			
			points.push(webpageData[i].points);
		}
		
	
		
		alreadyPushed=[];
		
		var webpagesSent=0;
		
		points.sort(function(a, b){return b-a});
	
		for(i=0;i<=points.length-1;i++){
			
			for(j=webpageData.length-1;j>=0;j--){
				
				if(webpageData[j].points == points[i] && webpagesSent<=50 &&  webpageData[j].count == distinctKeyword.length && !alreadyPushed.includes(webpageData[j].id)){
					
					socket.emit("getTitleWebPage",webpageData[j].webpage);
				
					webpagesSent++;
					
					alreadyPushed.push(webpageData[j].id);
				}
			}
		}
	});
	
	socket.on("getDescriptionWebPages",function(keyword){
		
		var i,j,k,l,m;
		var webpageData=[];
		var points=[];
		var alreadyPushed=[];
		var words=[];
		
		var distinctKeyword=distinctArray(keyword.split(" "));
		
		for(i=0;i<=descriptionIndex.length-1;i++){
			
			for(j=0;j<=distinctKeyword.length-1;j++){
				
				if(descriptionIndex[i].word == distinctKeyword[j]){
					
					for(k=0;k<=descriptionIndex[i].index.length-1;k++){
						
						if(alreadyPushed.includes(descriptionIndex[i].index[k][0].id)){
							
							for(m=0;m<=webpageData.length-1;m++){
								
								if(descriptionIndex[i].index[k][0].id == webpageData[m].id){
									
									webpageData[m].points+=descriptionIndex[i].index[k][1];
									webpageData[m].count++;
									break;
									
								}
							}
						}
						
						else if(!alreadyPushed.includes(descriptionIndex[i].index[k][0].id)){
							
							webpageData.push({webpage:descriptionIndex[i].index[k][0],id:descriptionIndex[i].index[k][0].id,count:1,points:descriptionIndex[i].index[k][1]});
							
							alreadyPushed.push(descriptionIndex[i].index[k][0].id);
						}
						
					}
					
				}
			}
		}
		
		
		var searchString,searchDescriptionString,length,start,start2,count;
		
		for(i=0;i<=webpageData.length-1;i++){
			
			for(length=2;length<=keyword.split(" ").length-1 && length<=webpageData[i].webpage.searchDescription.split(" ").length-1;length++){
				
				for(start=0;start<=keyword.split(" ").length-1-(length-1);start++){
					
					count=0;
					
					for(start2=0;start2<=webpageData[i].webpage.searchDescription.split(" ").length-1-(length-1);start2++){
						
						searchString="";
					
						for(j=start;j<=start+length-1;j++){
							searchString+=keyword.split(" ")[j]+" ";
						}
				
						searchString=searchString.slice(0,searchString.length-1);
					
						searchDescriptionString="";
					
						for(j=start2;j<=start2+length-1;j++){
							searchDescriptionString+=webpageData[i].webpage.searchDescription.split(" ")[j]+" ";
						}
					
						searchDescriptionString=searchDescriptionString.slice(0,searchDescriptionString.length-1);
					
						
						if(searchString == searchDescriptionString){
								
							count++;
						}
					}
					
					webpageData[i].points+=length*(10-count);
				}
			}
		}
		
		
		for(i=0;i<=webpageData.length-1;i++){
			
			for(j=0;j<=webpageData[i].webpage.searchDescription.split(" ").length-1;j++){
				
				if(!keyword.split(" ").includes(webpageData[i].webpage.searchDescription.split(" ")[j])){
					webpageData[i].points--;
				}
			}
			
			if(webpageData[i].webpage.searchDescription == keyword){
				webpageData[i].points+=99999;
			}
			
			points.push(webpageData[i].points);
		}
		
	
		
		alreadyPushed=[];
		
		var webpagesSent=0;
		
		points.sort(function(a, b){return b-a});
	
		for(i=0;i<=points.length-1;i++){
			
			for(j=webpageData.length-1;j>=0;j--){
				
				if(webpageData[j].points == points[i] && webpagesSent<=50 &&  webpageData[j].count == distinctKeyword.length && !alreadyPushed.includes(webpageData[j].id)){
					
					socket.emit("getDescriptionWebPage",webpageData[j].webpage);
				
					webpagesSent++;
					
					alreadyPushed.push(webpageData[j].id);
				}
			}
		}
	});

	

	
	
	socket.on("sendImageDataURL",function(file){
		
		var i;
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id.toString()+webPages[i].name == file){
				socket.emit("getImageDataURL",{name:webPages[i].name,URL:webPages[i].code});
			}
			
		}
	});
	
	socket.on("getProfileImage",function(username){
		
		var i;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == username){
				socket.emit("sendProfileImage",userData[i].profileImg);
			}
		}
	});
	
	socket.on("updateProfileImage",function(data){
		
		var i;
		
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
			
			var i;
			
			var webpagesSent=0;
			
			for(i=webPages.length-1;i>=0;i--){
				
				if(webpagesSent<=50 && webPages[i].username == username){
					socket.emit("getUserWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
	});
	
	socket.on("sendWebPage",function(data){
			
			var hours,time,minutes;
			
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
		
		var i;
		
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].id.toString()+webPages[i].name == file){
				socket.emit("getComments",webPages[i].comments);
			}
		}
	});
	
	socket.on("addComment",function(data){
		
		var i;
		
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
		
		var i;
		var users=[];
		
		for(i=webPages.length-1;i>=webPages.length-20 && i>=0;i--){
			
			if(!users.includes(webPages[i].username)){
				
				socket.emit("getRecentlyUploadedWebPage",webPages[i]);
				
				users.push(webPages[i].username);
			}
	
		}
		
	});
	
	
	socket.on("deletePage",function(id){	
		
		var i;
		
		updateIndex();
		
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
});
	
	function distinctArray(array){
		
		var distinct=[];
		var i;
		
		for(i=0;i<=array.length-1;i++){
			
			if(!distinct.includes(array[i])){
				
				distinct.push(array[i]);	
			}
		}
		
		return distinct;
	}
	
	function updateIndex(){
		
		titleIndex=[];
		descriptionIndex=[];
		var indexed=[];
		var i,j,k,l;
		var count;
		var distinctSearchTitle,distinctSearchDescription;
		
		for(i=0;i<=webPages.length-1;i++){
			
			indexed=[];
			
			distinctSearchTitle = distinctArray(webPages[i].searchTitle.split(" "));
			
			for(j=0;j<=distinctSearchTitle.length-1;j++){
				
				count=0;
								
				for(k=0;k<=webPages[i].searchTitle.split(" ").length-1;k++){
						
					if(distinctSearchTitle[j].toLowerCase() == webPages[i].searchTitle.split(" ")[k].toLowerCase()){
							
						count++;
					}
				}
				
				
					if(!indexed.includes(distinctSearchTitle[j])){
						titleIndex.push({word:distinctSearchTitle[j],index:[[webPages[i],count]]});
						indexed.push(distinctSearchTitle[j]);
					}
				
					else if(indexed.includes(distinctSearchTitle[j])){
					
						for(l=0;l<=titleIndex.length-1;l++){
						
							if(titleIndex[l].word == distinctSearchTitle[j]){
							
								titleIndex[l].index.push([webPages[i],count]);
							}
						}
					}
				}

			indexed=[];
			
			distinctSearchDescription=distinctArray(webPages[i].searchDescription.split(" "));
			
			for(j=0;j<=distinctSearchDescription.length-1;j++){
				
				count=0;
								
				for(k=0;k<=webPages[i].searchDescription.split(" ").length-1;k++){
						
					if(distinctSearchDescription[j].toLowerCase() == webPages[i].searchDescription.split(" ")[k].toLowerCase()){
							
						count++;
					}
				}
				
				
					if(!indexed.includes(distinctSearchDescription[j])){
						descriptionIndex.push({word:distinctSearchDescription[j],index:[[webPages[i],count]]});
						indexed.push(distinctSearchDescription[j]);
					}
				
				
					else if(indexed.includes(distinctSearchDescription[j])){
					
						for(l=0;l<=descriptionIndex.length-1;l++){
						
							if(descriptionIndex[l].word == distinctSearchDescription[j]){
							
								descriptionIndex[l].index.push([webPages[i],count]);
							}
						}
					}
				}
			}
		}
	

	
http.listen(port, function() {
   console.log('listening on localhost'+port);
});