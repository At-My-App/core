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

  // Analytics handlers
  // Handler for basic event tracking
  http.post(`${API_BASE_URL}/analytics/:eventId/analytics`, ({ params }) => {
    const eventId = params.eventId as string;

    // Simulate different responses based on event ID
    if (eventId === "error_event") {
      return new HttpResponse(
        JSON.stringify({ error: "Event tracking failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return HttpResponse.json({ success: true, eventId });
  }),

  // Handler for custom event tracking
  http.post(
    `${API_BASE_URL}/analytics/:eventId`,
    async ({ request, params }) => {
      const eventId = params.eventId as string;
      const body = (await request.json()) as any;

      // Simulate different responses based on event ID
      if (eventId === "custom_error_event") {
        return new HttpResponse(
          JSON.stringify({ error: "Custom event tracking failed" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate data size and count for testing
      if (body.blobs && body.blobs.length > 20) {
        return new HttpResponse(
          JSON.stringify({ error: "Too many data entries" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return HttpResponse.json({
        success: true,
        eventId,
        receivedData: body.blobs,
      });
    }
  ),

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
