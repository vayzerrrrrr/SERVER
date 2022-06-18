//const fs = require('fs');
var http = require('https');
var Static = require('node-static');
var WebSocketServer = new require('ws');


var clients = {};
var userNick = {}; // Ник пользователя
var userRoom = {};
var userGameID = {};
var serverPort = 8089; // Порт сервера
var matchId = 0;


/*var fileServer = new Static.Server('.');
const server = http.createServer({
		cert: fs.readFileSync(__dirname + '/ssl/ssl.redtest.pp.ua.crt'),
		key: fs.readFileSync(__dirname + '/ssl/ssl.redtest.pp.ua.key'),
		ca: fs.readFileSync(__dirname + '/ssl/ssl.redtest.pp.ua.ca')
	}, (req, res) => {
	fileServer.serve(req, res);
});*/

//const axios = require('axios').default;
//const md5 = require('md5');
//const moment = require('moment');


function usersList(){  // Отправляем новый список пользователя
		   var listUser = "";     
		   for(var key in userNick) { // Делаем цикл
			    listUser = listUser + "~" + userGameID[key] + "~" + userRoom[key] + "~" + userNick[key];
				                     };
//				for(var key in clients) {clients[key].send("~users" + listUser);};
                        
};


//var webSocketServer = new WebSocketServer.Server({server});
var webSocketServer = new WebSocketServer.Server({port: serverPort});

webSocketServer.on('connection', function(ws) {

  var id =  matchId = matchId + 1; //Добавляем +1 к порядковому номеру (id) нового игрока
  clients[id] = ws;
  console.log("Новый игрок: id" + id);

  ws.on('message', function(message) {
    var  mes = message.split('~'); // разбиваем присланное сообщение
	
	
	 if(mes[1]== "gameid"){
		clients[id].nameGameID_ = mes[2];
		userGameID[id] = mes [2];
		usersList();
		console.log("Игрок: id" + id + " Игра: " + userGameID[id]);
	 };
	 
	 if (mes[1] == "ladroom"){ //Загрузка списка комнат
		for(var key in clients) {
		  if (clients[key].nameGameID_ ===  userGameID[id] && clients[key].nameRoom_ !== "" && clients[key].userNick_ !== userNick[id]) { //Все кто в игре, не в той же комнате, не с тем же ID  
			   clients[id].send("ledroom|" + userNick[key] + "|" + userRoom[key] + "|"); //отправляет ТЕГ | ID игрока | номер комнаты
			  };
			}
			console.log(userNick[id] + " Запрос на комнаты");
			clients[id].send("ledroomEND|"); //заключительно отправляет  тег для закрытия операции
	    };	
		
	 if (mes[1] == "ladroomSelect"){//заставляет всех игроаков в игре  обновить список комнат чтобы исключить клмнату в которую вы зашли
		for(var key in clients) {//перебираем всех игроков в игре
		    if (clients[key].nameGameID_ ===  userGameID[id]) { //если игрок соотвецтвует игре
		        for(var key2 in clients){//сново перебираем всех играков в игре
				    if (clients[key2].nameGameID_ ===  userGameID[id]){//если игрок соотвецтвует игре
			            clients[key].send("ledroom|" + userNick[key2] + "|" + userRoom[key2] + "|"); //отправляем его данные игроку
				    };
			    };
				clients[key].send("ledroomEND|");
			};
		}
		console.log(userNick[id] + " Вошел в комнату");
			
	};
	    		
     
   	 if (mes[1] == "nickname") { //внесение ID игрока 
		 clients[id].userNick_ = mes[2];
        userNick[id] = mes[2]; // добавляем новый ник
	    usersList();
		console.log("Игрок: id" + id + " Никнейм: " + userNick[id]);
	 };

     if (mes[1] == "room")		{ //внесение комнаты в список
		clients[id].nameRoom_ = mes[2];
        userRoom[id] = mes[2]; 
	    usersList();
		console.log("Игрок: id" + id + " Комната: " + userRoom[id]);		                           
	    };		
	                
	
	 if (mes[1] == "message") { //отправка сообщений только тем кто в комнате кроме отправителя
        for(var key in clients) {
		  if (clients[key].nameGameID_ ===  userGameID[id] && clients[key].nameRoom_ === userRoom[id] && clients[key].userNick_ !== userNick[id]) { // отсеевает в той же игре, в той же комнате, дугой ID
			   clients[key].send(userNick[id] +"|" + mes[2]); // Id игрока | ID комнаты | сообщение 
			   console.log(userNick[id] + " отправил: " + mes[2]);
			  };
			}
			//console.log(userNick[id] + "коната: " + userRoom[id] + " отправил: " + mes[2]);
	    };
		
		
	 if (mes[1] == "messageAll") { //отправка сообщений всем кто в комнате
        for(var key in clients) {
		  if (clients[key].nameGameID_ ===  userGameID[id] && clients[key].nameRoom_ ===  userRoom[id]) { 
			   clients[key].send(userNick[id] + "|" + mes[2]);
			  };
			}
			console.log(userNick[id] + " отправил: " + mes[2]);
	    };
		
	 if (mes[1] == "messageAllGame") { //отправка сообщений всем кто в игре 
        for(var key in clients) {
		  if (clients[key].nameGameID_ ===  userGameID[id]) { 
			   clients[key].send(userNick[id] + "|" + mes[2]);
			  };
			}
			console.log(userNick[id] + " отправил: " + mes[2]);
	    };
		
	 if (mes[1] == "messageID") { //отправка сообщений только конкретному игроку
	 var inid = mes[2];
	  for(var key in clients){
	    if (clients[key].userNick_ === inid){
		 clients[key].send(userNick[id] +"|" + mes[3]); // Id игрока | ID комнаты | сообщение 
		 console.log("сообщение для: " + inid + " от:" + userNick[id] + ":" + mes[3]);
		     };
	       };
	    };
								 
				
  });

  ws.on('close', function() {
	  for(var key in clients) {
		  if (clients[key].nameGameID_ ===  userGameID[id] && clients[key].nameRoom_ === userRoom[id]) {
		  clients[key].send(userNick[id] + "|close|");
		   } 
		  }; 
    console.log('Игрок покидает игру: id' + id + " nickname:  " + userNick[id]); // пользователь покидает чат
	delete userNick[id];
	delete userRoom[id];
    delete clients[id];
	usersList();

  });

});


var fileServer = new Static.Server('.');

//server.listen(serverPort+1);

console.log("Сервер запущен! v.1.47");


