const express = require('express');
const http = require('https');
const WebSocket = require('ws');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server, clientTracking: false });

let connections = [];
let messages = {};

function sendMessage( ws, message ) {
	const datetime = new Date();
	console.log(datetime.toLocaleTimeString('fr-FR') + ': sent message');
	console.log(message);

	ws.send( JSON.stringify(message) );
}

wss.on('connection', (ws, req) => {

	console.log('websocket started');

    ws.on('message', (m) => {
		const message = JSON.parse(m);
		const datetime = new Date();
		console.log(datetime.toLocaleTimeString('fr-FR') + ': received message');
		console.log(message);

		switch ( message.type ) {
			case "init":
				// init session for specific company
				console.log(`init session for ${message.usertype} - ${message.username} for ${message.company}`);

				const userid = message.userid;
				const company = message.company;

				conn = connections.find( (c) => c.userid == userid );

				if ( conn == undefined ) {
					connections.push({
						"company": message.company,
						"usertype": message.usertype,
						"userid": userid,
						"username": message.username,
						"status": "free",
						"ws": ws
					});
				} else {
					conn.ws = ws;
					conn.status = "free";
				}

				if ( messages[company] === undefined ) messages[company] = [];
				else {
					for ( let message of messages[company] ) sendMessage( ws, message );
				}

				break;

			// case "init":
			// 	// init session for specific company
			// 	console.log(`init session for ${company}`);
			//
			// 	if ( connections[company] == undefined ) {
			// 		connections[company] = { messages: [], clients: new Set() };
			// 	}
			// 	connections[company].clients.add(ws);
			//
			// 	if ( connections[company].messages.length > 0 ) {
			// 		for ( let message of connections[company].messages ) ws.send(JSON.stringify(message));
			// 	}
			// 	break;

			case "message":
				console.log('forward messages');
				// forward received message
				let now = new Date();
				message.date = `${now.getFullYear()}/${now.getMonth()}/${now.getDay()}-${now.getHours()}:${now.getMinutes()}`;

				connections.forEach( (conn) => {
					if ( conn.company === message.company ) {
						if ( conn.ws.readyState === WebSocket.OPEN ) {
							sendMessage( conn.ws, message );
						}
					}
				});

				messages[message.company].push(message);

				break;


			case "contact":
				console.log('find contact');
				const contact = connections.find( (conn) => conn.company === message.company && conn.status === 'free' && conn.usertype != message.usertype );

				let res = {};
				if ( contact !== undefined ) {
					res = {
						'type': 'contact',
						"company": contact.company,
						"usertype": contact.usertype,
						"userid": contact.userid,
						"username": contact.username
					};
				} else {
					res = {
						'type': 'contact',
						"error": 'nocontact'
					}
				}

				sendMessage( ws, res );

				break;

			default:
				break;
		}

    });
});

wss.on('error', (e) => { console.log('error'); console.log(e); });

const port = process.env.PORT || 10000;
server.listen(port, () => {
    console.log('Server started on port:' + port);
});
