const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server, clientTracking: false });

let connections = {};

wss.on('connection', (ws, req) => {

    ws.on('message', (m) => {
		const message = JSON.parse(m);
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
				console.log('received message:'); console.log(message);

				let now = new Date();
				message.date = `${now.getFullYear()}/${now.getMonth()}/${now.getDay()}-${now.getHours()}:${now.getMinutes()}`;

				connections[company].clients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN)  client.send(JSON.stringify(message));
				});

				connections[company].messages.push(message);

				break;
		}

    });
});

server.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
