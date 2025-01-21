const { PeerServer } = require("peer");

const peerServer = PeerServer({ port: 9000, path: "/myapp", "proxied": true });

console.log("peer server started");
