import { AtMyAppClientOptions, SubmissionsClient, SubmissionFormEncType, SubmissionFormParams, SubmissionSubmitOptions, SubmissionSubmitResult, SubmissionTypeStatus } from "./clientTypes";
import {
  compileSchema,
  type Definition,
  type FieldDefinition,
  type SchemaDocument,
} from "@atmyapp/structure";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: string;
};

type SubmissionTypeRecord = {
  type: string;
  accepting_responses?: boolean | null;
  requires_captcha?: boolean | null;
  captcha_provider?: string | null;
  static_form_url?: string | null;
};

type SubmissionAttachmentDescriptor = {
  key: string;
  file: Blob;
  fileName?: string;
};

type SubmissionAssetDescriptorValue = {
  file: unknown;
  name?: string;
  mimeType?: string;
  alt?: string;
};

type RuntimeSubmissionDefinition = {
  fields: Record<string, FieldDefinition>;
};

function normalizeRuntimeSchema(
  schema: AtMyAppClientOptions["schema"]
): SchemaDocument | null {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return null;
  }

  if (
    "version" in schema &&
    "definitions" in schema &&
    schema.definitions &&
    typeof schema.definitions === "object"
  ) {
    return schema as SchemaDocument;
  }

  if ("definitions" in schema && schema.definitions) {
    return {
      version: 1,
      definitions: schema.definitions as Record<string, Definition>,
      description:
        typeof (schema as SchemaDocument).description === "string"
          ? (schema as SchemaDocument).description
          : undefined,
      events:
        (schema as SchemaDocument).events &&
        typeof (schema as SchemaDocument).events === "object"
          ? (schema as SchemaDocument).events
          : {},
      args:
        (schema as SchemaDocument).args &&
        typeof (schema as SchemaDocument).args === "object"
          ? (schema as SchemaDocument).args
          : {},
      mdx:
        (schema as SchemaDocument).mdx &&
        typeof (schema as SchemaDocument).mdx === "object"
          ? (schema as SchemaDocument).mdx
          : {},
      submissions:
        (schema as SchemaDocument).submissions &&
        typeof (schema as SchemaDocument).submissions === "object"
          ? (schema as SchemaDocument).submissions
          : {},
    };
  }

  return {
    version: 1,
    definitions: schema as Record<string, Definition>,
    events: {},
    args: {},
    mdx: {},
    submissions: {},
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === "[object Object]"
  );
}

function isBinaryLike(value: unknown): value is { arrayBuffer(): Promise<ArrayBuffer>; type?: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}

function isSubmissionAssetDescriptor(
  value: unknown
): value is SubmissionAssetDescriptorValue {
  return Boolean(
    isPlainObject(value) &&
      "file" in value &&
      isBinaryLike((value as SubmissionAssetDescriptorValue).file)
  );
}

function hasAnyBinaryValue(value: unknown): boolean {
  if (isBinaryLike(value) || isSubmissionAssetDescriptor(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasAnyBinaryValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => hasAnyBinaryValue(entry));
  }

  return false;
}

function formatPath(path: Array<string | number>): string {
  return path.reduce<string>((result, segment, index) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }
    if (index === 0) {
      return segment;
    }
    return `${result}.${segment}`;
  }, "");
}

function toAttachmentRef(
  input: { mimeType?: string; name?: string; alt?: string }
) {
  const base = {
    ...(typeof input.name === "string" ? { name: input.name } : {}),
    ...(typeof input.mimeType === "string" ? { mimeType: input.mimeType } : {}),
  };

  if ("alt" in input && typeof input.alt === "string") {
    return {
      ...base,
      alt: input.alt,
    };
  }

  return base;
}

async function toBlob(
  value: { arrayBuffer(): Promise<ArrayBuffer>; type?: string },
  mimeType?: string
): Promise<Blob> {
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    if (mimeType && value.type !== mimeType) {
      return new Blob([await value.arrayBuffer()], { type: mimeType });
    }
    return value;
  }

  const content = await value.arrayBuffer();
  return new Blob([content], {
    type: mimeType ?? value.type ?? "application/octet-stream",
  });
}

async function serializeSubmissionPayload(
  input: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; attachments: SubmissionAttachmentDescriptor[] }> {
  const attachments: SubmissionAttachmentDescriptor[] = [];

  async function walk(
    value: unknown,
    path: Array<string | number>
  ): Promise<unknown> {
    if (isSubmissionAssetDescriptor(value)) {
      const blob = await toBlob(value.file as { arrayBuffer(): Promise<ArrayBuffer>; type?: string }, value.mimeType);
      attachments.push({
        key: formatPath(path),
        file: blob,
        fileName: value.name,
      });
      return toAttachmentRef({
        name: value.name,
        mimeType: value.mimeType ?? (value.file as { type?: string }).type,
        alt: value.alt,
      });
    }

    if (isBinaryLike(value)) {
      const blob = await toBlob(value);
      const possibleNamedValue = value as { name?: unknown };
      const name =
        typeof possibleNamedValue.name === "string"
          ? possibleNamedValue.name
          : undefined;
      attachments.push({
        key: formatPath(path),
        file: blob,
        fileName: name,
      });
      return toAttachmentRef({
        name,
        mimeType: value.type,
      });
    }

    if (Array.isArray(value)) {
      const treatAsAttachmentList =
        value.length > 0 &&
        value.every(
          (entry) => isBinaryLike(entry) || isSubmissionAssetDescriptor(entry)
        );

      if (treatAsAttachmentList) {
        return Promise.all(value.map((entry) => walk(entry, path)));
      }

      return Promise.all(
        value.map((entry, index) => walk(entry, [...path, index]))
      );
    }

    if (isPlainObject(value)) {
      const next: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(value)) {
        next[key] = await walk(entry, [...path, key]);
      }
      return next;
    }

    return value;
  }

  const data = (await walk(input, [])) as Record<string, unknown>;
  return { data, attachments };
}

function submissionUsesFiles(field: FieldDefinition): boolean {
  if (field.kind === "asset") {
    return true;
  }

  if (field.kind === "object") {
    return Object.values(field.fields).some((entry) => submissionUsesFiles(entry));
  }

  if (field.kind === "array") {
    return submissionUsesFiles(field.items);
  }

  if (field.kind === "union") {
    return field.variants.some((entry) => submissionUsesFiles(entry));
  }

  return false;
}

function inferEncType(
  submission: RuntimeSubmissionDefinition | undefined
): SubmissionFormEncType {
  if (!submission) {
    return "multipart/form-data";
  }

  return Object.values(submission.fields).some((field) => submissionUsesFiles(field))
    ? "multipart/form-data"
    : "application/x-www-form-urlencoded";
}

function toSubmissionStatus(record: SubmissionTypeRecord | null): SubmissionTypeStatus | null {
  if (!record) {
    return null;
  }

  return {
    type: record.type,
    acceptingResponses:
      record.accepting_responses === null ||
      record.accepting_responses === undefined
        ? true
        : record.accepting_responses,
    requiresCaptcha: Boolean(record.requires_captcha),
    captchaProvider: record.captcha_provider ?? null,
    formUrl: record.static_form_url ?? null,
  };
}

export const createSubmissionsClient = <TSchema = unknown>(
  clientOptions: AtMyAppClientOptions
): SubmissionsClient<TSchema> => {
  const submissionsUrl = `${clientOptions.baseUrl}/submissions`;
  const fetchImpl = clientOptions.customFetch ?? fetch;
  const schemaDocument = normalizeRuntimeSchema(clientOptions.schema);
  const compiledSchema = schemaDocument ? compileSchema(schemaDocument) : null;
  const compiledSubmissions =
    ((compiledSchema as { submissions?: Record<string, RuntimeSubmissionDefinition> } | null)
      ?.submissions) ?? {};

  const request = async <T>(
    path: string,
    init?: RequestInit
  ): Promise<T> => {
    const response = await fetchImpl(`${submissionsUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${clientOptions.apiKey}`,
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !payload?.success) {
      throw new Error(
        payload?.error || `Submissions request failed with status ${response.status}`
      );
    }

    return payload.data;
  };

  async function getTypeStatus(submission: string): Promise<SubmissionTypeStatus | null> {
    const records = await request<SubmissionTypeRecord[]>("/types", {
      method: "GET",
    });
    const match = records.find((entry) => entry.type === submission) ?? null;
    return toSubmissionStatus(match);
  }

  async function isAcceptingResponses(submission: string): Promise<boolean> {
    const status = await getTypeStatus(submission);
    return status?.acceptingResponses ?? false;
  }

  async function getFormUrl(submission: string): Promise<string> {
    const data = await request<{ formUrl: string | null }>(
      `/${encodeURIComponent(submission)}/form-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!data.formUrl) {
      throw new Error(`Submission "${submission}" does not have a public form URL`);
    }

    return data.formUrl;
  }

  async function getFormParams(submission: string): Promise<SubmissionFormParams> {
    const action = await getFormUrl(submission);
    const encType = inferEncType(compiledSubmissions[submission]);

    return {
      action,
      method: "POST",
      encType,
    };
  }

  async function submit(
    submission: string,
    data: Record<string, unknown> | FormData,
    options?: SubmissionSubmitOptions
  ): Promise<SubmissionSubmitResult> {
    const path = `/${encodeURIComponent(submission)}`;

    if (data instanceof FormData) {
      return request<SubmissionSubmitResult>(path, {
        method: "POST",
        body: data,
        signal: options?.signal,
      });
    }

    if (hasAnyBinaryValue(data)) {
      const serialized = await serializeSubmissionPayload(data);
      const formData = new FormData();
      formData.set("data", JSON.stringify(serialized.data));

      for (const attachment of serialized.attachments) {
        if (attachment.fileName) {
          formData.append(attachment.key, attachment.file, attachment.fileName);
        } else {
          formData.append(attachment.key, attachment.file);
        }
      }

      return request<SubmissionSubmitResult>(path, {
        method: "POST",
        body: formData,
        signal: options?.signal,
      });
    }

    return request<SubmissionSubmitResult>(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: options?.signal,
    });
  }

  return {
    submit,
    getFormUrl,
    getFormParams,
    isAcceptingResponses,
    getTypeStatus,
  };
};
