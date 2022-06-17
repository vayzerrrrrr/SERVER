const uWS = require('uWebSockets.js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const ACTIONS_ENUM = {
    REFRESH_USERS_TO_CLIENTS: 'REFRESH_USERS_TO_CLIENTS',
    ADD_USER: 'ADD_USER',
    LEAVE_USER: 'LEAVE_USER',
    ADD_MESSAGE: 'ADD_MESSAGE',
    REFRESH_MESSAGES_TO_CLIENTS: 'REFRESH_MESSAGES_TO_CLIENTS',
}

const ROOMS_OF_CHAT = {
    GENERAL: '/CHAT/GENERAL',
}

let users = [];
let messages = [];

const CHAT = {
    addUser: (ws, user) => {
        ws.uuid = user.uuid; // определяем uuid для подключения к веб-сокету
        users = [...users, user]; // добавляем пользователя в массив объектов
        ws.publish(ROOMS_OF_CHAT.GENERAL, JSON.stringify({ // уведомляем всех подключенных клиентов о новом пользователе
            action: ACTIONS_ENUM.REFRESH_USERS_TO_CLIENTS,
            data: {
                users: users
            }
        }));

        ws.publish(ROOMS_OF_CHAT.GENERAL, JSON.stringify({
            action: ACTIONS_ENUM.REFRESH_MESSAGES_TO_CLIENTS,
            data: {
                messages: messages
            }
        }));
    },
    addMessage: (ws, message) => {
        if (message) {
            messages = [...messages, message]; // я добавляю пользователя в массив объектов
            ws.publish(ROOMS_OF_CHAT.GENERAL, JSON.stringify({  // уведомить всех подключенных клиентов о новом сообщении!
                action: ACTIONS_ENUM.REFRESH_MESSAGES_TO_CLIENTS,
                data: {
                    messages: messages
                }
            }));
        }
    },
    closeUser: (app, ws) => {
        if (ws.uuid) {
            users = users.filter((u) => u.uuid !== ws.uuid);
            app.publish(ROOMS_OF_CHAT.GENERAL, JSON.stringify({ // уведомляем клиентов о новом сообщении
                action: ACTIONS_ENUM.REFRESH_USERS_TO_CLIENTS,
                data: {
                    users: users
                }
            }));
        }
    }
};

const app = uWS.App({
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    passphrase: '123456789'
}).ws('/*', {
    open: (ws, req) => {
        ws.subscribe(ROOMS_OF_CHAT.GENERAL); // код для выполнения будет выполнен, когда клиент подключится к серверу
    },
    message: (ws, message, isBinary) => {
        let json = JSON.parse(decoder.write(Buffer.from(message)));

        switch (json.action) {
            case ACTIONS_ENUM.ADD_USER: // действие по добавлению пользователя
                if (json.data.user) {
                    CHAT.addUser(ws, json.data.user);
                }
                break;
            case ACTIONS_ENUM.ADD_MESSAGE: // действие по добавлению сообщения
                if (json.data.message) {
                    CHAT.addMessage(ws, json.data.message);
                }
                break;
            default:
                break;
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