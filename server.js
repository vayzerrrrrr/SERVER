const uWS = require('uWebSockets.js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
var shortid = require('shortid');



const ACTIONS = {
    MESSAGE: "message",
    CONNECT: "CONNECT",
}

const ROOMS = {
    GENERAL: '/LOBBY',
    PRIVATE: '/PRIVATE'
}

let users = []; // массив игроков
let messages = []; // массив сообщений чата

const CHAT = {
    addUser: (ws, user) => {

    },
    addMessage: (ws, message) => {
            messages = [...messages, message];
            ws.publish(ROOMS.message, JSON.stringify({  // послать всем клиентам сообщение
                action: ACTIONS.REFRESH_MESSAGES,
                data: {
                    messages: messages
                }
            }));
    },
    closeUser: (app, ws) => {
        var User_ID  = users.indexOf(ws.uuid);
        if (User_ID !== -1) {
            users.splice(User_ID, 1);
        }
    }
};

const app = uWS.App({
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    passphrase: '123456789'
}).ws('/*', {
    open: (ws, req) => {
        ws.subscribe(ROOMS.PRIVATE); // 
    },
    message: (ws, message, isBinary) => {
        let json = JSON.parse(decoder.write(Buffer.from(message)));
        console.log(json);
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