const uWS = require('uWebSockets.js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
var shortid = require('shortid'); // изменяемая переменная
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ACTIONS = {
    MESSAGE: "message",
    CONNECT: "CONNECT",


    REFRESH_USERS: 'REFRESH_USERS_TO_CLIENTS',
    ADD_USER: 'ADD_USER',
    LEAVE_USER: 'LEAVE_USER',
    ADD_MESSAGE: 'ADD_MESSAGE',
    REFRESH_MESSAGES: 'REFRESH_MESSAGES_TO_CLIENTS',
}

const ROOMS = {
    GENERAL: '/LOBBY',
}

let users = []; // [] значит массив, users = массив игроков
let messages = []; // [] значит массив, messages = массив сообщений

const CHAT = {
    addUser: (ws, user) => {
        ws.uuid = shortid(shortid.generate()); // определяем uuid для подключения к веб-сокету
        console.log(ws.uuid);

        //users = [...users, user.uuid]; // добавляем пользователя в массив объектов. [...users,] троиточие значит добавить к массиву

        //console.log(cerf);


        ws.publish(ROOMS.GENERAL, JSON.stringify({ // уведомляем всех подключенных клиентов о новом пользователе
            action: ACTIONS.REFRESH_USERS,
            data: {
                users: users
            }
        }));

        ws.publish(ROOMS.GENERAL, JSON.stringify({
            action: ACTIONS.REFRESH_MESSAGES,
            data: {
                messages: messages
            }
        }));
    },
    addMessage: (ws, message) => {
            messages = [...messages, message]; // я добавляю пользователя в массив объектов
            ws.publish(ROOMS.GENERAL, JSON.stringify({  // уведомить всех подключенных клиентов о новом сообщении!
                action: ACTIONS.REFRESH_MESSAGES,
                data: {
                    messages: messages
                }
            }));
    },
    closeUser: (app, ws) => {
        if (ws.uuid) {
            users = users.filter((u) => u.uuid !== ws.uuid);
            app.publish(ROOMS.GENERAL, JSON.stringify({ // уведомляем клиентов о новом сообщении
                action: ACTIONS.REFRESH_USERS,
                data: {
                    users: users  
                }
            }));
            var User_ID  = users.indexOf(ws.uuid);
            if (User_ID !== -1) {
                users.splice(User_ID, 1);
            }
            // console.log(users);
        }
    }
};

const app = uWS.App({
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    passphrase: '123456789'
}).ws('/*', {
    open: (ws, req) => {
        ws.subscribe(ROOMS.GENERAL); // код для выполнения будет выполнен, когда клиент подключится к серверу
    },
    message: (ws, message, isBinary) => {
        let json = JSON.parse(decoder.write(Buffer.from(message)));
           if (json.MSG) { // если простое сообщение
              console.log("just message", json);

              CHAT.addMessage(ws, json.MSG);
           }
           else { // если сообщение о подключении игрока к серверу, тогда производится запись игрока
            if (json.CONNECT) {
               CHAT.addUser(ws, json.CONNECT)

               console.log("another", json);
            }
           }

    },
    close: (ws, code, message) => {
        
        CHAT.closeUser(app, ws);
    }
});
















app.listen(5000, (listenSocket) => {
    if (listenSocket) {
        console.log("сервер запущен на порту 5000");
    }
})