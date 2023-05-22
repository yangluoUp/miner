const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = 3001;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 存储游戏状态
let gameBoard = [];

// 监听客户端连接
io.on('connection', (socket) => {
  console.log('A user connected');

  // 发送游戏状态给新连接的客户端
  socket.emit('gameState', gameBoard);

  // 监听客户端扫雷事件
  socket.on('revealCell', ({ row, col }) => {
    // 执行游戏逻辑，更新游戏状态
    if (gameBoard[row][col].hasMine) {
    //   revealAllMines();
      revealAllCells();
      io.emit('gameOver');
    } else {
      revealCell(row, col);
    }

    // 向所有客户端广播更新后的游戏状态
    io.emit('gameState', gameBoard);
  });

  // 监听客户端标记格子事件
  socket.on('markCell', ({ row, col }) => {
    gameBoard[row][col].marked = !gameBoard[row][col].marked;

    // 向所有客户端广播更新后的游戏状态
    io.emit('gameState', gameBoard);
  });
    
    // 监听客户端重置游戏事件
  socket.on('resetGame', () => {
    createGameBoard();
    io.emit('gameState', gameBoard);
    io.emit('gameReset');
  });

  // 监听客户端断开连接事件
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// 创建游戏板
function createGameBoard() {
  const rows = 16; // 行数
  const cols = 16; // 列数
  const mines = 40; // 地雷数

  for (let i = 0; i < rows; i++) {
    gameBoard[i] = [];
    for (let j = 0; j < cols; j++) {
      gameBoard[i][j] = { revealed: false, hasMine: false, marked: false };
    }
  }

  // 随机布置地雷
  let count = 0;
  while (count < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (!gameBoard[row][col].hasMine) {
      gameBoard[row][col].hasMine = true;
      count++;
    }
  }
}

// 揭示格子
function revealCell(row, col) {
  if (gameBoard[row][col].revealed) {
    return;
  }

  gameBoard[row][col].revealed = true;

  // 如果格子周围没有地雷，则继续揭示相邻格子
  if (countAdjacentMines(row, col) === 0) {
    revealAdjacentCells(row, col);
  }
  checkWin(16,16,25);
}

// 揭示相邻格子
function revealAdjacentCells(row, col) {
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i >= 0 && i < gameBoard.length && j >= 0 && j < gameBoard[0].length) {
        revealCell(i, j);
      }
    }
  }
}

// 揭示所有格子
function revealAllCells() {
  for (let i = 0; i < gameBoard.length; i++) {
    for (let j = 0; j < gameBoard[0].length; j++) {
      gameBoard[i][j].revealed = true;
    }
  }
}

// 计算相邻格子的地雷数
function countAdjacentMines(row, col) {
  let count = 0;
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i >= 0 && i < gameBoard.length && j >= 0 && j < gameBoard[0].length && gameBoard[i][j].hasMine) {
        count++;
      }
    }
  }
  return count;
}

// 检查胜利条件
function checkWin(rows,cols,mines) {
    let revealedCount = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (gameBoard[i][j].revealed) {
                revealedCount++;
            }
        }
      }
    if (revealedCount === rows * cols - mines) {
        io.emit('gameWin');
    }
}


// 启动服务器
server.listen(PORT, () => {
  console.log(`Socket.IO server running at http://localhost:${PORT}/`);
  createGameBoard();
});
