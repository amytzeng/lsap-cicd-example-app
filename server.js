// server.js
const app = require("./app");
const PORT = 3000;

// Start the server
// Listen on 0.0.0.0 to accept connections from outside the container
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

// Export the server instance for testing
module.exports = server;
