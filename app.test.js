// app.test.js
const request = require("supertest");
const app = require("./app"); // Import the app logic

// Use supertest's built-in functionality to test the app directly
// This avoids port conflicts in CI/CD environments like Jenkins
// Supertest automatically handles server lifecycle without manual port management

describe("API Endpoints", () => {
  it("should return a 200 OK status and welcome message for the root endpoint", async () => {
    // Test against the app directly using supertest
    // Supertest will automatically start and stop the server for each request
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Welcome to the CI/CD Workshop!");
  });

  it("should return a valid ISO-formatted date string for /time endpoint", async () => {
    // Test the /time endpoint
    const res = await request(app).get("/time");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("time");
    
    // Validate ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
    // ISO 8601 format with milliseconds and UTC timezone indicator
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(res.body.time).toMatch(isoDateRegex);
    
    // Verify it's a valid date by parsing and comparing
    // This ensures the string represents a valid date object
    const date = new Date(res.body.time);
    expect(date.toISOString()).toBe(res.body.time);
  });
});
