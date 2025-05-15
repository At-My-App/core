// test/handlers.ts
import { http, HttpResponse } from "msw"; // Using MSW v2+ syntax

// Define your base API URL for consistency
export const API_BASE_URL = "http://localhost:8585"; // Replace with your actual API base

export const file_json = {
  data: 1,
};

export const preview_json = {
  data: 2,
};

export const handlers = [
  // Handler for GET requests to /storage/f/file.json
  http.get(`${API_BASE_URL}/storage/f/file.json`, () => {
    return HttpResponse.json(file_json);
  }),

  // Default handler for paths not explicitly defined
  http.get(`${API_BASE_URL}/storage/f/:path`, ({ params }) => {
    const path = params.path as string;

    // Simulate different responses based on path patterns
    if (path.includes("missing")) {
      return new HttpResponse(null, { status: 404 });
    }

    if (path.includes("auth")) {
      return new HttpResponse(null, { status: 401 });
    }

    if (path.includes("error")) {
      return new HttpResponse(
        JSON.stringify({ error: { message: "Server error", status: 500 } }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Default success response
    return HttpResponse.json({
      path,
      data: "Default mock response",
    });
  }),
];
