import type {
  DocumentDefinition,
  FieldDefinition,
} from "@atmyapp/structure";

const EMPTY_ASSET_VALUE = {
  url: "",
} as const;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isOptionalField(field: FieldDefinition): boolean {
  if (field.default !== undefined) {
    return true;
  }
  if (typeof field.optional === "boolean") {
    return field.optional;
  }
  if (typeof field.required === "boolean") {
    return !field.required;
  }
  return false;
}

function buildFieldPlaceholder(
  field: FieldDefinition,
  force = false,
): unknown | undefined {
  if (field.default !== undefined) {
    return cloneValue(field.default);
  }

  if (!force && isOptionalField(field)) {
    return undefined;
  }

  switch (field.kind) {
    case "scalar":
      if (field.scalar === "number") {
        return 0;
      }
      if (field.scalar === "boolean") {
        return false;
      }
      if (field.scalar === "null") {
        return null;
      }
      return "";
    case "enum":
      return field.values.length > 0 ? cloneValue(field.values[0]) : null;
    case "object": {
      const value: Record<string, unknown> = {};
      for (const [name, child] of Object.entries(field.fields)) {
        const childValue = buildFieldPlaceholder(child);
        if (childValue !== undefined) {
          value[name] = childValue;
        }
      }
      return value;
    }
    case "array":
      return [];
    case "union":
      return field.variants.length > 0
        ? buildFieldPlaceholder(field.variants[0], true)
        : null;
    case "asset":
      return field.assetKind === "gallery" || field.multiple === true
        ? []
        : { ...EMPTY_ASSET_VALUE };
    case "reference":
      return field.multiple === true ? [] : "";
    case "mdx":
    case "slug":
      return "";
    default:
      return undefined;
  }
}

function hasEnabledSlugSystemField(definition: DocumentDefinition): boolean {
  const slugConfig = definition.systemFields?.slug;

  if (slugConfig === false) {
    return false;
  }

  if (
    slugConfig &&
    typeof slugConfig === "object" &&
    "enabled" in slugConfig &&
    slugConfig.enabled === false
  ) {
    return false;
  }

  return Boolean(slugConfig);
}

export function buildDocumentPlaceholder(
  definition: DocumentDefinition,
): Record<string, unknown> {
  const value: Record<string, unknown> = {};

  for (const [name, field] of Object.entries(definition.fields)) {
    const fieldValue = buildFieldPlaceholder(field);
    if (fieldValue !== undefined) {
      value[name] = fieldValue;
    }
  }

  if (hasEnabledSlugSystemField(definition) && value.slug === undefined) {
    value.slug = "";
  }

  return value;
}

export function buildEmptyAssetValue(): { url: string } {
  return { ...EMPTY_ASSET_VALUE };
}
