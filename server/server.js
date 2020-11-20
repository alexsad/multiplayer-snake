// const content = require('fs').readFileSync(__dirname + '/../frontend/index.html', 'utf8');

// const express = require("express");
const express = require('express');
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);
const { initGame, gameLoop, getUpdatedVelocity, newPlayerObject } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');


// const httpServer = require('http').createServer((req, res) => {
//   // serve the index.html file
//   res.setHeader('Content-Type', 'text/html');
//   res.setHeader('Content-Length', Buffer.byteLength(content));
//   res.end(content);
// });

// const io = ioDefault(httpServer);

// const app = express();
// app.use(express.static('frontend'));

// const server = http.Server(app);
// const io = ioDefault(server);

// app.set('port', process.env.PORT || 8123);

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/../frontend/index.html');
// });


app.use(express.static('./'));

const state = {};
const clientRooms = {};

io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 20) {
      client.emit('tooManyPlayers');
      return;
    }

    state[roomName].players.push(newPlayerObject());
    state[roomName].boots.push(newPlayerObject({path:[]}));
    

    clientRooms[client.id] = roomName;

    client.join(roomName);
    // client.number = 2;
    client.number = numClients+1;
    // client.number = numClients;
    client.emit('init', client.number);
    
    // startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);


    // client.emit('init', client.number);
    
    startGameInterval(roomName);

  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel && state[roomName] &&  state[roomName].players[client.number - 1]) {

      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);
    // emitGameState(roomName, state[roomName]);
    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

// io.listen(process.env.PORT || 3000);


// server.listen(app.get('port'), () => {
//   console.log(`listening on :${app.get('port')}`);
// });

// server.listen(process.env.PORT || 3000, function () {
//   console.log('listening on port 3000');
//   // console.log(`listening on :${app.get('port')}`);
// });

// httpServer.listen(process.env.PORT || 3000, function () {
//   console.log('listening on port 3000');
// });

http.listen(process.env.PORT || 22222, () => {
  console.log('listening on *:3000');
});
