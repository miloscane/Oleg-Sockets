var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200);
    response.write("Mathieu");
    response.end();
});
server.listen(39050, function() {
    console.log((new Date()) + ' Server is listening on port '+39050);
    console.log("Server version v1.6")
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var requestID = 0;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            var data = message.binaryData;
            var buf         =   Buffer.from( data , 'hex' );
            var bufLen = buf.readUInt32LE(0);
            var checkByte = buf.readInt8(4);
            var checkByte2 = buf.readInt8(5);
            console.log("First (INTEGER - 4Byte)");
            console.log(buf.readUInt32LE(0));
            console.log("-----------------");
            console.log("Second (BYTE - 1Byte)");
            console.log(checkByte);
            console.log("-----------------");
            console.log("Third (BYTE - 1Byte)");
            console.log(checkByte2);
            console.log("-----------------");
            console.log("Sending response back to MM:")
            var replyBuff   =   Buffer.alloc(9);
            replyBuff.writeUInt32LE( replyBuff.length , 0);
            requestID++;
            replyBuff.writeUInt32LE( requestID , 4);
            replyBuff.writeUInt8( checkByte , 8);
            connection.sendBytes(replyBuff)
            console.log("RECEIVED BUFFER LENGTH = "+replyBuff.length+" (INTEGER - 4Byte) | REQUESTID = "+requestID+" (INTEGER - 4Byte) | REQUEST TYPE = " +checkByte+" (BYTE - 1Byte)");
            
            
        }else{
            console.log("Unknown message type received");
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});