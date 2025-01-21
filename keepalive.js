// const WSServer = 'wss://simplechatbot-670i.onrender.com';
const WSServer = 'ws://localhost:10000';


const ws = new WebSocket(WSServer);
console.log('Trying opening Web Socket');

function keepalive() {
    const message={ "type": "alive" };
    const datetime = new Date();
    ws.send( JSON.stringify(message) );
    console.log(datetime.toLocaleTimeString('fr-FR') + ': Keep alive message sent');
    setTimeout( () => { keepalive(); }, 60000 );
}

ws.onopen = () => {
    console.log('Web Socket ready');

    keepalive();
}

