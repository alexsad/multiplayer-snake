const express = require('express');
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);
const { initGame, gameLoop, getUpdatedVelocity, newPlayerObject } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');

app.use(express.static('./frontend'));

const state = {};
const clientRooms = {};

io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);

  function handleJoinGame(roomName) {
    const numClients = io.sockets.adapter.rooms.get(roomName).size;
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
    client.number = numClients+1;
    client.emit('init', client.number);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);    
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

http.listen(process.env.PORT || 22222, () => {
  console.log('listening on *:22222');
});
