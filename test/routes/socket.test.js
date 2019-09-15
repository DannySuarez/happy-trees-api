const { getToken, getToken2, getUserId } = require('../data-helpers');
const io = require('socket.io-client');
const http = require('../../lib/app');

describe('auth routes', () => {
  let socket1;
  let socket2;

  let userId;
  beforeEach(async() => {
    http.listen(3001);

    const token = getToken();
    const token2 = getToken2();

    userId = getUserId();

    socket1 = io.connect('http://localhost:3001', {
      extraHeaders: { Cookie: token },
      'reconnection delay' : 0, 
      'reopen delay' : 0, 
      'force new connection' : true, 
      transports: ['websocket']
    });

    socket2 = io.connect('http://localhost:3001', {
      extraHeaders: { Cookie: token2 },
      'reconnection delay' : 0, 
      'reopen delay' : 0, 
      'force new connection' : true, 
      transports: ['websocket']
    });
  });

  afterEach(() => {
    http.close();
  });

  it('starts a game and sends a stroke', (done) => {
    socket2.on('stroke', (data) => {
      expect(data).toEqual({
        x: 0,
        y: 10,
        px: 30,
        py: 47,
        color: '#000000',
        strokeWidth: 5
      });
      socket1.close();
      socket2.close();
      done();
    });
    socket1.on('start game', startRound => {
      socket1.emit('stroke', { data, gameId: startRound.gameId });
    });
    const data = {
      x: 0,
      y: 10,
      px: 30,
      py: 47,
      color: '#000000',
      strokeWidth: 5
    };
    socket1.emit('find game');
    setTimeout(() => {
      socket2.emit('find game');
    }, 100);
  });

  it('starts a game and and sends a correct answer', (done) => {
    socket2.on('correct answer', ({ isCorrect }) => {
      expect(isCorrect).toEqual(true);
      socket1.close();
      socket2.close();
      done();
    });
    socket1.on('start game', (startRound) => {
      socket1.emit('answer', { 
        answer: 'trees', 
        roundId: startRound._id, 
        gameId: startRound.gameId,
        userId 
      });
    });
    socket1.emit('find game');
    setTimeout(() => {
      socket2.emit('find game');
    }, 100);
  });
});
