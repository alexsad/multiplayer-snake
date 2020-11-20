const { GRID_SIZE } = require('./constants');
const PF = require('pathfinding');

function initGame() {
  const state = createGameState()
  randomFood(state);
  return state;
}

const newPlayerObject = (otherProps = {}) => {
  const hexColor = Math.floor(Math.random()*16777215).toString(16);

  return {
    color: `#${hexColor}`,
    pos: {
      x: 3,
      y: 10,
    },
    vel: {
      x: 0,
      y: 0,
    },
    snake: [
      {x: 1, y: 10},
      {x: 2, y: 10},
      {x: 3, y: 10},
    ],
    ...otherProps
  }
}

function createGameState() {

  const genBlocks = () => {
    const blocks = [];
    const block = () => {
      return {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    }

    const blockCount = parseInt(GRID_SIZE * 0.3);

    for(let i = 0; i < blockCount; i++){
      blocks.push(block());
    }
    return blocks;
  }

  const blocks = genBlocks();

  return {
    players: [newPlayerObject()],
    boots:[newPlayerObject({path:[]})],
    blocks:[
      ...blocks
    ],
    food: {},
    gridsize: GRID_SIZE,
  };
}

const updatePlayerPosition = ({pos, vel}, blocks) => {
  pos.x += vel.x;
  pos.y += vel.y;

  let xfail = pos.x < 0 || pos.x > GRID_SIZE-1;
  let yfail = pos.y < 0 || pos.y > GRID_SIZE-1;

  if(!xfail && !yfail){
    const xyfail = blocks.some(block => block.x === pos.x && block.y === pos.y);
    xfail = xyfail && vel.x !== 0; 
    yfail = xyfail && vel.y !== 0;
  }

  if(xfail){
    pos.x -= vel.x;
  }
  if(yfail){
    pos.y -= vel.y;
  }

  if(pos.y < 0){
    pos.y = 0;
  }
  if(pos.x < 0){
    pos.x = 0;
  }


  return {
    pos,vel
  }
}

function gameLoop(state) {
  if (!state) {
    return;
  }

  state.boots.forEach(boot => {
    if(boot.path && boot.path.length > 1){
      let pathIndex = boot.path.findIndex(path => path[0] === boot.pos.x && path[1] === boot.pos.y);
      if(typeof boot.path[pathIndex+1] === 'undefined'){
        return;
      }
      const path = pathIndex > -1 ? boot.path[pathIndex+1] : boot.path[1];
      boot.vel.y = 0;
      boot.vel.x = 0;
      if(path[0] > boot.pos.x){
        boot.vel.x = 1;
      }else if(path[0] < boot.pos.x){
        boot.vel.x = -1;
      }else if(path[1] < boot.pos.y){
        boot.vel.y = -1;
      }else if(path[1] > boot.pos.y){
        boot.vel.y = 1;
      }
      return;
    }
  
    const grid = new PF.Grid(GRID_SIZE+1, GRID_SIZE+1); 
  
    state.blocks.forEach(block => {
      // matrix[block.y][block.x] = 1;
      grid.setWalkableAt(block.x, block.y, false);
    });

    const finder = new PF.AStarFinder();

    // console.log(JSON.stringify(grid));

    // console.log('I"m live!!!',boot.pos);

    if(
      boot.pos.x > -1 &&
      boot.pos.y > -1
    ){
      try {
        boot.path = finder.findPath(boot.pos.x, boot.pos.y, state.food.x, state.food.y, grid);
      } catch (error) {
        console.log('other find!!!',boot.pos, state.food);
        console.log(error);
      }
    }else{
      boot.path.length = 0;
    }
    


    
  
    // console.log(grid, finder.findPath(boot.pos.x, boot.pos.y, state.food.x, state.food.y, grid));
    // console.log(matrix, boot.pos, state.food);

  });

  [...state.players, ...state.boots].forEach(player => {
    const {pos:{x,y}} = updatePlayerPosition({...player}, [...state.blocks]);
    player.pos.x = x;
    player.pos.y = y;

    if(state.food.x === player.pos.x && state.food.y === player.pos.y){
      player.snake.push({ ...player.pos });
      player.pos.x += player.vel.x;
      player.pos.y += player.vel.y;
      randomFood(state);
      state.boots.forEach(boot => boot.path.length = 0);
    }

    player.snake.push({ ...player.pos });
    player.snake.shift();
  });






  // const playerOne = state.players[0];
  // const playerTwo = state.players[1];

  // if (playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE) {
  //   // return 2;
  // }

  // if (playerTwo.pos.x < 0 || playerTwo.pos.x > GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y > GRID_SIZE) {
  //   // return 1;
  // }

  // if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
  //   playerOne.snake.push({ ...playerOne.pos });
  //   playerOne.pos.x += playerOne.vel.x;
  //   playerOne.pos.y += playerOne.vel.y;
  //   randomFood(state);
  // }

  // if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
  //   playerTwo.snake.push({ ...playerTwo.pos });
  //   playerTwo.pos.x += playerTwo.vel.x;
  //   playerTwo.pos.y += playerTwo.vel.y;
  //   randomFood(state);
  // }

  // if (playerOne.vel.x || playerOne.vel.y) {
  //   for (let cell of playerOne.snake) {
  //     if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
  //       // return 2;
  //     }
  //   }

  //   playerOne.snake.push({ ...playerOne.pos });
  //   playerOne.snake.shift();
  // }

  // if (playerTwo.vel.x || playerTwo.vel.y) {
  //   for (let cell of playerTwo.snake) {
  //     if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
  //       // return 1;
  //     }
  //   }

  //   playerTwo.snake.push({ ...playerTwo.pos });
  //   playerTwo.snake.shift();
  // }

  return false;
}

function randomFood(state) {
  const randomFoodPosition = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  food = randomFoodPosition();

  for(let player of state.players){
    if(player.snake.some(cell => cell.x === food.x && cell.y === food.y)){
      return randomFood(state);
    }
  }

  for(let block of state.blocks){
    if (block.x === food.x && block.y === food.y) {
      return randomFood(state);
    }
  }

  state.food = food;
}

function getUpdatedVelocity(keyCode) {
  switch (keyCode) {
    case 37: { // left
      return { x: -1, y: 0 };
    }
    case 38: { // down
      return { x: 0, y: -1 };
    }
    case 39: { // right
      return { x: 1, y: 0 };
    }
    case 40: { // up
      return { x: 0, y: 1 };
    }
  }
}

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity,
  newPlayerObject,
}