// jest.config.js
module.exports = {
  preset: "ts-jest", // Use ts-jest preset for TypeScript
  testEnvironment: "node", // Environment for running tests (node is common for libraries)
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // A list of paths to modules that run some code to configure or set up the testing framework before each test file in the suite is executed
  setupFilesAfterEnv: ["./test/setupTests.ts"], // Path to your MSW server setup
  // Module file extensions for Jest to look for
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Transform files with ts-jest
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // ts-jest configuration options go here
        // For example, if your tsconfig.json is not in the root:
        // tsconfig: 'path/to/your/tsconfig.json'
      },
    ],
  },
  // Test match patterns
  testMatch: [
    "**/test/**/*.test.ts", // Looks for .test.ts files in any __tests__ folder
    "**/?(*.)+(spec|test).ts", // Looks for .spec.ts or .test.ts files
  ],
  // Optional: If you want to collect coverage from specific files
  collectCoverageFrom: [
    "src/**/*.ts", // Collect coverage from all .ts files in src
    "!src/**/*.d.ts", // Exclude declaration files
  ],
};
