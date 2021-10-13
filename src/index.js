const path = require('path');
const http = require('http');
const express = require('express');
const Filter = require('bad-words');
const socketio = require('socket.io');
const { generateMessage } = require('./utils/messages');
const { generateUrl } = require('./utils/urlCreator');
const {
  getUser,
  getUsersInRoom,
  removeUser,
  addUser,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  console.log('connection approved');

  // // emit that particular connection
  // socket.emit('message', generateMessage('Welcome!'));

  // // emit everyone not that particular connection
  // socket.broadcast.emit('message', generateMessage('A new user joined'));

  socket.on('join', ({ username, room }, callback) => {
    const { user, error } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome!'));

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} has joined!`)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    // acknowledge
    callback();

    // without room concept use ----------- socket.emit, io.emit, socket.broadcast.emit
    // with room concept use ---------- io.to.emit, socket.broadcast.to.emit
  });

  socket.on('sendMessage', (message, callBack) => {
    const filter = new Filter();
    const user = getUser(socket.id);
    console.log('user+++++++++++++++++', user);
    if (filter.isProfane(message)) return callBack('Profanity not allowed');

    // emit to everyone (under a room)
    io.to(user.room).emit('message', generateMessage(user.username, message));

    callBack('Delivered');
  });

  socket.on('sendLocation', (location) => {
    const user = getUser(socket.id);
    // emit to everyone
    io.to(user.room).emit(
      'locationMessage',
      generateUrl(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left!`)
      );

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => console.log(`server is up on port ${port}`));
