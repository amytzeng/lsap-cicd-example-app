// app.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res
    .status(200)
    .send("<h1>Welcome to the CI/CD Workshop! - test 1</h1>");
});

// Add time endpoint 新增這裡
app.get("/time", (req, res) => {
  const currentTime = new Date().toISOString();
  res.status(200).json({ time: currentTime });
});
// 到這裡

// Health check endpoint for deployment verification
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

module.exports = app;
