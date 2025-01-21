const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server, clientTracking: false });

let connections = {};

wss.on('connection', (ws, req) => {

	console.log('websocket started');

    ws.on('message', (m) => {
		const message = JSON.parse(m);
		const datetime = new Date();
		console.log(datetime.toLocaleTimeString('fr-FR') + ': received message');
		console.log(message);

		const company = message.company;


		switch ( message.type ) {
			case "init":
				// init session for specific company
				console.log(`init session for ${company}`);

				if ( connections[company] == undefined ) {
					connections[company] = { messages: [], clients: new Set() };
				}
				connections[company].clients.add(ws);

				if ( connections[company].messages.length > 0 ) {
					for ( let message of connections[company].messages ) ws.send(JSON.stringify(message));
				}
				break;

			case "message":
				// forward received message
				let now = new Date();
				message.date = `${now.getFullYear()}/${now.getMonth()}/${now.getDay()}-${now.getHours()}:${now.getMinutes()}`;

				connections[company].clients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN)  client.send(JSON.stringify(message));
				});

				connections[company].messages.push(message);

				break;

			default:
				break;
		}

    });
});

wss.on('error', (e) => { console.log('error'); console.log(e); });

const port = process.env.PORT || 10000;
server.listen(port, () => {
    console.log('Server started on port:'+port);
});
