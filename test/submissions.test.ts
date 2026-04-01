import {
  createAtMyAppClient,
} from "../src";
import {
  defineDocument,
  defineSchema,
  defineSubmission,
  s,
} from "@atmyapp/structure";
import { API_BASE_URL } from "./handlers";
import { server } from "./server";
import { http, HttpResponse } from "msw";

type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;

const schema = defineSchema({
  definitions: {
    settings: defineDocument({
      fields: {
        title: s.string(),
      },
    }),
  },
  submissions: {
    contact: defineSubmission({
      fields: {
        name: s.string(),
        email: s.email(),
        message: s.longText({ optional: true }),
        resume: s.file({ optional: true }),
      },
      captcha: {
        required: true,
        provider: "hcaptcha",
      },
    }),
  },
});

describe("Submissions client", () => {
  it("types schema-aware submission helpers from runtime schema", () => {
    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });

    if (false) {
      const submitPromise = client.submissions.submit("contact", new FormData());

      type SubmitResult = Awaited<typeof submitPromise>;
      type _submitResultNotAny = Assert<IsAny<SubmitResult> extends false ? true : false>;
      type _submitResultShape = Assert<
        SubmitResult extends { submissionId: string } ? true : false
      >;

      const formParamsPromise = client.submissions.getFormParams("contact");
      type FormParams = Awaited<typeof formParamsPromise>;
      type _formParamsShape = Assert<
        FormParams extends { action: string; method: "POST" } ? true : false
      >;

      // @ts-expect-error missing required email field
      client.submissions.submit("contact", {
        name: "Ada",
      });

      // @ts-expect-error invalid submission name should not type-check
      client.submissions.getFormParams("missing");
    }

    expect(true).toBe(true);
  });

  it("returns accepting-responses status and form params", async () => {
    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });
    const genericClient = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
    });

    await expect(client.submissions.isAcceptingResponses("contact")).resolves.toBe(
      true
    );
    await expect(genericClient.submissions.isAcceptingResponses("closed")).resolves.toBe(
      false
    );
    await expect(genericClient.submissions.getTypeStatus("missing")).resolves.toBeNull();

    const formParams = await client.submissions.getFormParams("contact");
    expect(formParams).toEqual({
      action: "https://edge.atmyapp.com/forms/project/contact",
      method: "POST",
      encType: "multipart/form-data",
    });
  });

  it("submits plain JSON payloads for non-file submissions", async () => {
    let contentType: string | null = null;
    let receivedBody: unknown;

    server.use(
      http.post(`${API_BASE_URL}/submissions/:submissionType`, async ({ request, params }) => {
        if (params.submissionType !== "contact") {
          return HttpResponse.json({
            success: false,
            data: null,
            error: "Unexpected type",
          }, { status: 400 });
        }

        contentType = request.headers.get("content-type");
        receivedBody = await request.json();

        return HttpResponse.json({
          success: true,
          data: {
            submissionId: "contact-json-id",
          },
          error: "",
        });
      })
    );

    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });

    const result = await client.submissions.submit("contact", {
      name: "Ada",
      email: "ada@example.com",
      message: "Hello",
    });

    expect(result).toEqual({ submissionId: "contact-json-id" });
    expect(contentType).toContain("application/json");
    expect(receivedBody).toEqual({
      name: "Ada",
      email: "ada@example.com",
      message: "Hello",
    });
  });

  it("serializes file payloads into multipart form data", async () => {
    let contentType: string | null = null;
    let dataField: string | null = null;
    let fileName: string | null = null;

    server.use(
      http.post(`${API_BASE_URL}/submissions/:submissionType`, async ({ request }) => {
        contentType = request.headers.get("content-type");
        const formData = await request.formData();
        dataField = formData.get("data") as string | null;
        const upload = formData.get("resume");
        fileName =
          upload && typeof upload === "object" && "name" in upload
            ? String((upload as File).name)
            : null;

        return HttpResponse.json({
          success: true,
          data: {
            submissionId: "contact-file-id",
          },
          error: "",
        });
      })
    );

    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });

    const resume = new File(["resume"], "resume.pdf", {
      type: "application/pdf",
    });

    const result = await client.submissions.submit("contact", {
      name: "Ada",
      email: "ada@example.com",
      resume,
    });

    expect(result).toEqual({ submissionId: "contact-file-id" });
    expect(contentType).toContain("multipart/form-data");
    expect(fileName).toBe("resume.pdf");
    expect(JSON.parse(dataField || "{}")).toEqual({
      name: "Ada",
      email: "ada@example.com",
      resume: {
        name: "resume.pdf",
        mimeType: "application/pdf",
      },
    });
  });
});
