// test/setupTests.ts
import { server } from "./server"; // Path to your MSW server setup

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "error" })); // Error on unhandled requests

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
