const net = require('net');

function testPort(port, host) {
  const socket = new net.Socket();

  console.log(`Testing TCP connection to ${host}:${port}...`);

  socket.setTimeout(5000);

  socket.on('connect', () => {
    console.log(`✅ Connection to port ${port} SUCCESSFUL!`);
    socket.destroy();
  });

  socket.on('timeout', () => {
    console.log(`❌ Connection to port ${port} TIMED OUT.`);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.log(`❌ Connection to port ${port} FAILED: ${err.message}`);
  });

  socket.connect(port, host);
}

testPort(6543, 'aws-0-us-east-1.pooler.supabase.com');
