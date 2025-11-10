import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

// --- Test Configuration ---
export const options = {
  // This defines the load profile for the test.
  stages: [
    { duration: "10s", target: 50 }, // Ramp up to 20 virtual users over 10s
    { duration: "20s", target: 50 }, // Stay at 20 virtual users for 20s
    { duration: "5s", target: 0 }, // Ramp down to 0
  ],
  // This defines the success criteria for the test.
  thresholds: {
    http_req_failed: ["rate<0.01"], // Error rate should be less than 1%
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
  },
};

// --- Test Data ---
// Pre-load some data to use in the test.
const testData = new SharedArray("car test data", function () {
  return [
    { brands: "Toyota,Ford" },
    { brands: "BMW" },
    { searchTerm: "engine" },
    { searchTerm: "custom" },
  ];
});

// --- The Test Itself ---
export default function () {
  const baseUrl = "http://localhost:5001/api/v1/cars";
  const randomData = testData[Math.floor(Math.random() * testData.length)];

  // Simulate different types of user requests randomly
  const scenarios = {
    "01_getAll": {
      method: "GET",
      url: `${baseUrl}`,
    },
    "02_sortOldest": {
      method: "GET",
      url: `${baseUrl}?sortBy=oldest`,
    },
    "03_filterByBrand": {
      method: "GET",
      url: `${baseUrl}?brands=${randomData.brands}`,
    },
    "04_search": {
      method: "GET",
      url: `${baseUrl}?searchTerm=${randomData.searchTerm}`,
    },
  };

  // Execute a random scenario
  const responses = http.batch(Object.values(scenarios));

  // --- Checks ---
  // Verify that the server is responding correctly.
  for (const res of Object.values(responses)) {
    check(res, {
      "is status 200": (r) => r.status === 200,
      "has response body": (r) => r.body && r.body.length > 0,
    });
  }

  // Simulate a user pausing for 1 second before the next action.
  sleep(1);
}
