(function(){
  const BG_COLOUR = '#231f20';
  const FOOD_COLOUR = '#e66916';

  // const socket = io('https://sleepy-island-33889.herokuapp.com/');
  // const socket = io('http://127.0.0.1:3000');
  // const socket = io(`${document.location.protocol}//${document.location.hostname}:3000`);
  // const socket = io(`ws://${document.location.host}`);
  const socket = io();

  socket.on('init', handleInit);
  socket.on('gameState', handleGameState);
  socket.on('gameOver', handleGameOver);
  socket.on('gameCode', handleGameCode);
  socket.on('unknownCode', handleUnknownCode);
  socket.on('tooManyPlayers', handleTooManyPlayers);

  const gameScreen = document.getElementById('gameScreen');
  const initialScreen = document.getElementById('initialScreen');
  const newGameBtn = document.getElementById('newGameButton');
  const joinGameBtn = document.getElementById('joinGameButton');
  const gameCodeInput = document.getElementById('gameCodeInput');
  const gameCodeDisplay = document.getElementById('gameCodeDisplay');

  (function(){
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('room')){
      gameCodeInput.value = urlParams.get('room');
    }
  })()




  newGameBtn.addEventListener('click', newGame);
  joinGameBtn.addEventListener('click', joinGame);


  function newGame() {
    socket.emit('newGame');
    init();
  }

  function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
  }

  let canvas, ctx;
  let playerNumber;
  let gameActive = false;

  function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener('keydown', keydown);
    gameActive = true;
  }

  function keydown(e) {
    socket.emit('keydown', e.keyCode);
  }

  function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    state.players.forEach(player => {
      paintPlayer(player, size, player.color);
    });

    state.boots.forEach(boot => {
      paintPlayer(boot, size, boot.color);
    });

    state.blocks.forEach(block => {
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = '#efefef';
      ctx.strokeRect(block.x * size, block.y * size, size, size);
    })
  }

  function paintPlayer(playerState, size, colour) {
    const snake = playerState.snake;

    ctx.fillStyle = colour;
    for (let cell of snake) {
      ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
  }

  function handleInit(number) {
    playerNumber = number;
  }

  function handleGameState(gameState) {
    if (!gameActive) {
      return;
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
  }

  function handleGameOver(data) {
    if (!gameActive) {
      return;
    }
    data = JSON.parse(data);

    gameActive = false;

    if (data.winner === playerNumber) {
      alert('You Win!');
    } else {
      alert('You Lose :(');
    }
  }

  function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = `${gameCode} or access ${document.location.origin}${document.location.pathname}?room=${gameCode}`;
  }

  function handleUnknownCode() {
    reset();
    alert('Unknown Game Code')
  }

  function handleTooManyPlayers() {
    reset();
    alert('This game is already in progress');
  }

  function reset() {
    playerNumber = null;
    gameCodeInput.value = '';
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
  }

})()







