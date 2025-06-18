#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('viewer:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '80');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      // Tentative de trouver un port disponible
      //findAvailablePort(port);
      break;
    default:
      throw error;
  }
}
server.on("close", function() {console.log("closed");});
/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
 

    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
      console.log('Listening on ' + bind)
    debug('Listening on ' + bind);
  
}
/*
// Nouvelle fonction pour trouver un port disponible
function findAvailablePort() {
  console.log(port+1)
  port++
  var tempServer = http.createServer(app);
  tempServer.listen(port);
  console.log('Tentative de connexion sur le port ' + port);
  tempServer.on('error', function(error) {
    console.log(error)
    if (error.code === 'EADDRINUSE') {
      //tempServer.close();
      delete tempServer
       findAvailablePort(port);
    } else {
      throw error;
    }
  });
  tempServer.on('listening', function () {
   
  });
  
  tempServer.closeAllConnections()
  tempServer.close(function(error){
    console.log(error)
  })
  delete tempServer
  return port
}*/
