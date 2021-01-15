var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var path = require("path");
var {v4:uuidV4}= require("uuid");

var userData=[],webPages=[];
var webPageId=0;
var fileExist=false;
var titleIndex=[],descriptionIndex=[],titleWords=[],descriptionWords=[];

const programFiles =["register.html","login.html","search.html","update.html","communications.js"];
const port = process.env.PORT || 60274;
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


app.get('/', function (req, res) {
	
	res.sendfile("register.html");
});

app.get('/:file',function(req,res){
	
		var i,j;
		
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
				
				for(j=0;j<=webPages[i].comments.length-1;j++){
					
					if(webPages[i].comments[j].name == req.params.file){
						fileExist=true;
					}
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
		userData.push({username:data.username,password:data.password,sharedPosts:[],profileImg:'<img width="100" height="100" onerror="invalidProfileImage()"id="profile" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm_kVdMwEYyU95pNWTknAUfKokV1owQDTaVA&usqp=CAU">'});

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
	

	
	socket.on("getTitleWebPages",function(keyword){
		
		var i,j,k,l,m;
		var webpageData=[];
		var points=[];
		var alreadyPushed=[];
		var listOfWebpages=[];
		
		var distinctKeyword=distinctArray(keyword.split(" "));
		
		for(i=0;i<=distinctKeyword.length-1;i++){
			
			for(j=0;j<=titleIndex.length-1;j++){
				
				if(titleIndex[j].word == distinctKeyword[i]){
					
					for(k=0;k<=titleIndex[j].index.length-1;k++){
						
						if(titleIndex[j].index[k][1] > 0){
					
							if(alreadyPushed.includes(titleIndex[j].index[k][0].id)){
							
								for(m=0;m<=listOfWebpages.length-1;m++){
								
									if(titleIndex[j].index[k][0].id == listOfWebpages[m].webpage.id){
									
									
										listOfWebpages[m].points+=100-titleIndex[j].index[k][1];
										listOfWebpages[m].count++;
										break;
									
									}
								}
							}
						
							else if(!alreadyPushed.includes(titleIndex[j].index[k][0].id) && titleIndex[j].index[k][1] > 0){
							
						
								listOfWebpages.push({webpage:titleIndex[j].index[k][0],points:100-titleIndex[j].index[k][1],count:1});
								alreadyPushed.push(titleIndex[j].index[k][0].id);
							}
						}
					}
				}
			}
		}
		
		for(i=0;i<=listOfWebpages.length-1;i++){
			
			if(listOfWebpages[i].count >= distinctKeyword.length){
				webpageData.push({webpage:listOfWebpages[i].webpage,id:listOfWebpages[i].webpage.id,points:listOfWebpages[i].points});
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
					
						webpageData[i].points+=length*(100-count);
					
				}
			}
		}
		
		
		
		for(i=0;i<=webpageData.length-1;i++){
			
			for(j=0;j<=webpageData[i].webpage.searchTitle.split(" ").length-1;j++){
				
				if(!distinctKeyword.includes(webpageData[i].webpage.searchTitle.split(" ")[j])){
					webpageData[i].points--;
				}
			}
			
			if(webpageData[i].webpage.searchTitle == keyword){
				webpageData[i].points+=999999;
			}
			
			points.push(webpageData[i].points);
		}
		
	
		
		alreadyPushed=[];
		
		var webpagesSent=0;
		
		points.sort(function(a, b){return b-a});
	
		for(i=0;i<=points.length-1;i++){
			
			for(j=webpageData.length-1;j>=0;j--){
				
				if(webpageData[j].points == points[i] && webpagesSent<=50 && !alreadyPushed.includes(webpageData[j].id)){
					
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
		var listOfWebpages=[];
		
		var distinctKeyword=distinctArray(keyword.split(" "));
		
		for(i=0;i<=distinctKeyword.length-1;i++){
			
			for(j=0;j<=descriptionIndex.length-1;j++){
				
				if(descriptionIndex[j].word == distinctKeyword[i]){
					
					for(k=0;k<=descriptionIndex[j].index.length-1;k++){
						
						if(descriptionIndex[j].index[k][1] > 0){
							
							if(alreadyPushed.includes(descriptionIndex[j].index[k][0].id)){
							
								for(m=0;m<=listOfWebpages.length-1;m++){
								
									if(descriptionIndex[j].index[k][0].id == listOfWebpages[m].webpage.id){
									
									
										listOfWebpages[m].points+=2500-descriptionIndex[j].index[k][1];
										listOfWebpages[m].count++;
										break;
									
									}
								}	
							}
						
							else if(!alreadyPushed.includes(descriptionIndex[j].index[k][0].id) && descriptionIndex[j].index[k][1] > 0){
							

								listOfWebpages.push({webpage:descriptionIndex[j].index[k][0],points:2500-descriptionIndex[j].index[k][1],count:1});
								alreadyPushed.push(descriptionIndex[j].index[k][0].id);
							}
						}
					}
				}
			}
		}
		
		for(i=0;i<=listOfWebpages.length-1;i++){
			
			if(listOfWebpages[i].count >= distinctKeyword.length){
				webpageData.push({webpage:listOfWebpages[i].webpage,id:listOfWebpages[i].webpage.id,points:listOfWebpages[i].points});
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
					

						webpageData[i].points+=length*(2500-count);
					
				}
			}
		}
		
		
		for(i=0;i<=webpageData.length-1;i++){
			
			for(j=0;j<=webpageData[i].webpage.searchDescription.split(" ").length-1;j++){
				
				if(!distinctKeyword.includes(webpageData[i].webpage.searchDescription.split(" ")[j])){
					webpageData[i].points--;
				}
			}
			
			if(webpageData[i].webpage.searchDescription == keyword){
				webpageData[i].points+=999999999;
			}
			
			points.push(webpageData[i].points);
		}
		
	
		
		alreadyPushed=[];
		
		var webpagesSent=0;
		
		points.sort(function(a, b){return b-a});
	
		for(i=0;i<=points.length-1;i++){
			
			for(j=webpageData.length-1;j>=0;j--){
				
				if(webpageData[j].points == points[i] && webpagesSent<=50 && !alreadyPushed.includes(webpageData[j].id)){
					
					socket.emit("getDescriptionWebPage",webpageData[j].webpage);
				
					webpagesSent++;
					
					alreadyPushed.push(webpageData[j].id);
				}
			}
		}
	});

	
	socket.on("sendCommentImageDataURL",function(file){
		
		var i;
		
		for(i=0;i<=webPages.length-1;i++){
			
			for(j=0;j<=webPages[i].comments.length-1;j++){
		
				if(webPages[i].comments[j].name == file){
					socket.emit("getImageDataURL",{name:webPages[i].comments[j].name,URL:webPages[i].comments[j].code});
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
	
	socket.on("getPublicallySentWebPages",function(username){
			
		var i;
		
		for(i=webPages.length-1;i>=0;i--){
			if(webPages[i].username == username && !webPages[i].deleted && webPages[i].status == "Public"){
				socket.emit("getPublicallySentWebPage",webPages[i]);
			}
		}
	});
	
	socket.on("getPrivatelySentWebPages",function(username){
			
		var i;
		
		for(i=webPages.length-1;i>=0;i--){
				
			if(webPages[i].username == username && !webPages[i].deleted && webPages[i].status == "Private"){
				socket.emit("getPrivatelySentWebPage",webPages[i]);
			}
		}
	});
	
	socket.on("getPrivatelyRecievedWebPages",function(username){
			
		var i;
		
		for(i=webPages.length-1;i>=0;i--){

			if(webPages[i].reciever == username && !webPages[i].deleted && webPages[i].status == "Private"){

				socket.emit("getPrivatelyRecievedWebPage",webPages[i]);
			}
		}
	});
	
	socket.on("getSharedWebPages",function(username){
			
		var i,j;
		
		for(i=0;i<=userData.length-1;i++){
			
			for(j=userData[i].sharedPosts.length-1;j>=0;j--){
				
				if(userData[i].username == username && !userData[i].sharedPosts[j].deleted){

					socket.emit("getSharedWebPage",userData[i].sharedPosts[j]);
				}
			}
		}
	});
	
	socket.on("getUserWebPages",function(username){
			
		var i;
			
		var webpagesSent=0;
			
		for(i=webPages.length-1;i>=0;i--){
				
			if(webpagesSent<=50 && webPages[i].username == username && !webPages[i].deleted && webPages[i].status == "Public"){
				socket.emit("getUserWebPage",webPages[i]);
					
				webpagesSent++;
			}
		}
	});
	
	socket.on("sendWebPage",function(data){
			
			var hours,time,i;
			
			webPageId++;


			if(data.name != "NO FILE ATTACHMENT"){
				
				data.name=data.name.slice(12,data.name.length);
				
				if(!["jpg","jpeg","png","gif"].includes(data.name.split(".")[data.name.split(".").length-1])){
					fs.writeFile(webPageId.toString()+data.name, data.code, function (err) {
				
					});
				}
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
					
			if(data.status == "Public"){
								
				io.sockets.emit("getPublicallySentWebPage",{profileImg:data.profileImg,profileImageSrc:data.profileImageSrc,username:data.username,title:data.title,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,comments:[],dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false,reciever:data.reciever,status:"Public",imageHeight:data.imageHeight,imageWidth:data.imageWidth});
				
				webPages.push({profileImg:data.profileImg,profileImageSrc:data.profileImageSrc,username:data.username,title:data.title,searchTitle:data.searchTitle,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,searchDescription:data.searchDescription,comments:[],dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false,reciever:data.reciever,status:data.status,imageHeight:data.imageHeight,imageWidth:data.imageWidth});
				
				addPageToIndex();

			}
			
			else if(data.status == "Private"){
				
				
				for(i=0;i<=userData.length-1;i++){
					
					if(userData[i].username == data.reciever){
						
						io.sockets.emit("getPrivatelySentWebPage",{profileImg:data.profileImg,profileImageSrc:data.profileImageSrc,username:data.username,title:data.title,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,comments:[],dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false,reciever:data.reciever,status:"Private",imageHeight:data.imageHeight,imageWidth:data.imageWidth});
				
						io.sockets.emit("getPrivatelyRecievedWebPage",{profileImg:data.profileImg,profileImageSrc:data.profileImageSrc,username:data.username,title:data.title,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,comments:[],dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false,reciever:data.reciever,status:"Private",imageHeight:data.imageHeight,imageWidth:data.imageWidth})
				
						webPages.push({profileImg:data.profileImg,profileImageSrc:data.profileImageSrc,username:data.username,title:data.title,searchTitle:data.searchTitle,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,searchDescription:data.searchDescription,comments:[],dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false,reciever:data.reciever,status:data.status,imageHeight:data.imageHeight,imageWidth:data.imageWidth});
					
					}
				}
			}
			
			

			
			

			
	});
	
	socket.on("sharePost",function (data){
		
		var hours,time,i,j,date;
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id == data.id){
				
				for(j=0;j<=userData.length-1;j++){
					
					if(userData[j].username == data.reciever){
						date = new Date();
			
			if(date.getHours()+1 < 13){
				
				hours=date.getHours();
				time=" am";
			}
			
			else if(date.getHours()+1 >= 13){
				hours=date.getHours()-12;
				time=" pm";
			}
					

				
			
			
	
				
			
	
						
						io.sockets.emit("getSharedWebPage",{profileImg:webPages[i].profileImg,profileImageSrc:webPages[i].profileImageSrc,username:webPages[i].username,title:webPages[i].title,image:webPages[i].image,imageSrc:webPages[i].imageSrc,name:webPages[i].name,code:webPages[i].code,description:webPages[i].description,comments:[],dateString:months[date.getMonth()]+" "+date.getDate().toString()+", "+date.getFullYear().toString()+" at "+hours+":"+date.getMinutes()+time,id:webPages[i].id,deleted:false,sharer:data.sharer,reciever:data.reciever,imageHeight:webPages[i].imageHeight,imageWidth:webPages[i].imageWidth});
				

						userData[j].sharedPosts.push({profileImg:webPages[i].profileImg,profileImageSrc:webPages[i].profileImageSrc,username:webPages[i].username,title:webPages[i].title,searchTitle:webPages[i].searchTitle,image:webPages[i].image,imageSrc:webPages[i].imageSrc,name:webPages[i].name,code:webPages[i].code,description:webPages[i].description,searchDescription:webPages[i].searchDescription,comments:[],dateString:months[date.getMonth()]+" "+date.getDate().toString()+", "+date.getFullYear().toString()+" at "+hours+":"+date.getMinutes()+time,id:webPages[i].id,deleted:false,sharer:data.sharer,reciever:data.reciever,imageHeight:webPages[i].imageHeight,imageWidth:webPages[i].imageWidth});
					
					
				
			
			
						
					
					}
				}
			}
		}
		
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
		
		var i,j;
		
		webPageId++;
		
		for(i=0;i<=webPages.length-1;i++){
			
			
			if(data.type == "message"){
				

				if(webPages[i].id.toString()+webPages[i].name == data.webPageFileName){
						
					webPages[i].comments.push({type:data.type,code:data.code,sender:data.sender});
					
				}
				
			}
			
			else if(data.type != "message"){
			
				if(webPages[i].id.toString()+webPages[i].name == data.webPageFileName){
				
				
					data.name=data.name.slice(12,data.name.length);
				
					if(!["jpg","jpeg","png","gif"].includes(data.name.split(".")[data.name.split(".").length-1])){
					
						fs.writeFile(webPageId.toString()+data.name, data.code, function (err) {
						});
					
						webPages[i].comments.push({type:data.type,name:webPageId.toString()+data.name,sender:data.sender});

					}
				
					else if(["jpg","jpeg","png","gif"].includes(data.name.split(".")[data.name.split(".").length-1])){

						webPages[i].comments.push({type:data.type,name:webPageId.toString()+data.name,code:data.code,sender:data.sender});
					}
				
				}
			
			}
		}
	});
	
	socket.on("getRecentlyUploadedWebPages",function(){
		
		var i;
		var users=[];
		
		for(i=webPages.length-1;i>=webPages.length-20 && i>=0;i--){
			
			if(!users.includes(webPages[i].username) && !webPages[i].deleted && webPages[i].status == "Public"){
				
				socket.emit("getRecentlyUploadedWebPage",webPages[i]);
				
				users.push(webPages[i].username);
			}
	
		}
		
	});
	
	
	socket.on("deletePage",function(id){	
		
		var i;
		
				
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id==id){
				
				if(webPages[i].status == "public"){
					deletePageFromIndex(id);
				}

				fs.unlink(webPages[i].id.toString()+webPages[i].name, function (err) {
					
				});
				
				webPages[i].deleted=true;
			}
		}
		
		
		for(i=0;i<=userData.length-1;i++){
			
			for(j=0;j<=userData[i].length-1;j++){
				
				if(userData[i].sharedPosts[j].id == id){
					
					userData[i].sharedPosts[j].deleted=true;
				}
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
	
	function addPageToIndex(){
		
		var i,j,k,l;
		var count;
		var distinctSearchTitle,distinctSearchDescription;
		
		distinctSearchTitle = distinctArray(webPages[webPages.length-1].searchTitle.split(" "));
			
		for(j=0;j<=distinctSearchTitle.length-1;j++){
				
			count=0;
								
			for(k=0;k<=webPages[webPages.length-1].searchTitle.split(" ").length-1;k++){
						
				if(webPages[webPages.length-1].status == "Public" && distinctSearchTitle[j].toLowerCase() == webPages[webPages.length-1].searchTitle.split(" ")[k].toLowerCase()){
							
					count++;
				}
			}
				
			if(count > 0){
				
				if(!titleWords.includes(distinctSearchTitle[j])){
					titleIndex.push({word:distinctSearchTitle[j],index:[[webPages[webPages.length-1],count]]});
					titleWords.push(distinctSearchTitle[j]);
				}
				
				else if(titleWords.includes(distinctSearchTitle[j])){
					
					for(l=0;l<=titleIndex.length-1;l++){
						
						if(titleIndex[l].word == distinctSearchTitle[j]){
							
							titleIndex[l].index.push([webPages[webPages.length-1],count]);
						}
					}
				}
			}
		}

			distinctSearchDescription=distinctArray(webPages[webPages.length-1].searchDescription.split(" "));
			
			for(j=0;j<=distinctSearchDescription.length-1;j++){
				
				count=0;
								
				for(k=0;k<=webPages[webPages.length-1].searchDescription.split(" ").length-1;k++){
						
					if(webPages[webPages.length-1].status == "Public" && distinctSearchDescription[j].toLowerCase() == webPages[webPages.length-1].searchDescription.split(" ")[k].toLowerCase()){
							
						count++;
					}
				}
				
				if(count>0){
				
					if(!descriptionWords.includes(distinctSearchDescription[j])){
						descriptionIndex.push({word:distinctSearchDescription[j],index:[[webPages[webPages.length-1],count]]});
						descriptionWords.push(distinctSearchDescription[j]);
					}
				
				
					else if(descriptionWords.includes(distinctSearchDescription[j])){
					
						for(l=0;l<=descriptionIndex.length-1;l++){
						
							if(descriptionIndex[l].word == distinctSearchDescription[j]){
							
								descriptionIndex[l].index.push([webPages[webPages.length-1],count]);
							}
						}
					}
				}
			}
		}
		
		function deletePageFromIndex(id){
	
			var i,j,k,l;
	
			for(i=0;i<=titleIndex.length-1;i++){
			
				for(j=0;j<=titleIndex[i].index.length-1;j++){
				
					if(titleIndex[i].index[j][0].id == id ){
						
						titleIndex[i].index[j][1]=0;
					}
				}
			}
		
			for(i=0;i<=descriptionIndex.length-1;i++){
			
				for(j=0;j<=descriptionIndex[i].index.length-1;j++){
				
					if(descriptionIndex[i].index[j][0].id == id){
						
						descriptionIndex[i].index[j][1]=0;
					}
				}
			}
		}

	
http.listen(port, function() {
   console.log('listening on localhost'+port);
});