import {
  AtMyAppClientOptions,
  CollectionsFilterExpr,
  CollectionsRawEntry,
} from "./clientTypes";

type NodeFs = typeof import("fs");
type NodePath = typeof import("path");

/**
 * Snapshot manifest structure
 */
interface SnapshotManifest {
  version: string;
  projectId: string;
  branch: string;
  generatedAt: string;
  collections: Record<string, CollectionManifest>;
  files?: Record<string, FileManifest>;
}

interface CollectionManifest {
  collectionName: string;
  entryCount: number;
  lastSynced?: string;
  entries: Record<
    string,
    { sha256: string; size: number; blobs?: Record<string, BlobManifest> }
  >;
}

interface FileManifest {
  path: string;
  sha256: string;
  size: number;
  mimeType?: string;
  lastModified?: string;
}

interface BlobManifest {
  sha256: string;
  size: number;
  mimeType?: string;
}

/**
 * Entry structure as stored in snapshot
 */
interface SnapshotEntry {
  id: string | number;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_LOCAL_PATH = ".ama/local";

let nodeFs: NodeFs | null = null;
let nodePath: NodePath | null = null;
let nodeModulesResolved = false;

function getNodeModules(): { fs: NodeFs; path: NodePath } | null {
  if (nodeModulesResolved) {
    return nodeFs && nodePath ? { fs: nodeFs, path: nodePath } : null;
  }

  nodeModulesResolved = true;

  if (typeof process === "undefined" || !process.versions?.node) {
    return null;
  }

  try {
    const nodeRequireFactory = Function("return require") as () => (
      id: string,
    ) => unknown;
    const nodeRequire = nodeRequireFactory();
    nodeFs = nodeRequire("fs") as NodeFs;
    nodePath = nodeRequire("path") as NodePath;
    return { fs: nodeFs, path: nodePath };
  } catch {
    nodeFs = null;
    nodePath = null;
    return null;
  }
}

function getResolvedLocalStoragePath(
  options: AtMyAppClientOptions,
): string | null {
  const modules = getNodeModules();
  if (!modules) {
    return null;
  }

  const localPath = options.localStorage?.path ?? DEFAULT_LOCAL_PATH;
  return modules.path.resolve(process.cwd(), localPath);
}

/**
 * Get the resolved local storage path
 */
export function getLocalStoragePath(options: AtMyAppClientOptions): string {
  return (
    getResolvedLocalStoragePath(options) ??
    options.localStorage?.path ??
    DEFAULT_LOCAL_PATH
  );
}

/**
 * Check if local storage exists and is valid
 */
export function isLocalStorageAvailable(
  options: AtMyAppClientOptions,
): boolean {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return false;
  }

  const manifestPath = modules.path.join(basePath, "manifest.json");
  return modules.fs.existsSync(manifestPath);
}

/**
 * Load the snapshot manifest
 */
export function loadManifest(
  options: AtMyAppClientOptions,
): SnapshotManifest | null {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return null;
  }

  const manifestPath = modules.path.join(basePath, "manifest.json");

  if (!modules.fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(modules.fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Read a file from local storage
 */
export function readLocalFile(
  filePath: string,
  options: AtMyAppClientOptions,
): Buffer | null {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return null;
  }

  const fullPath = modules.path.join(basePath, "f", filePath);

  if (!modules.fs.existsSync(fullPath)) {
    return null;
  }

  try {
    return modules.fs.readFileSync(fullPath);
  } catch {
    return null;
  }
}

/**
 * Read a file from local storage and return as JSON
 */
export function readLocalFileJson<T = unknown>(
  filePath: string,
  options: AtMyAppClientOptions,
): T | null {
  const buffer = readLocalFile(filePath, options);
  if (!buffer) {
    return null;
  }

  try {
    return JSON.parse(buffer.toString("utf-8"));
  } catch {
    return null;
  }
}

/**
 * Get the file:// URL for a local file
 */
export function getLocalFileUrl(
  filePath: string,
  options: AtMyAppClientOptions,
): string {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    throw new Error(
      "AtMyApp: local file URLs are only available in Node.js runtime",
    );
  }

  const fullPath = modules.path.join(basePath, "f", filePath);
  return `file://${fullPath.replace(/\\/g, "/")}`;
}

/**
 * Read a collection entry from local storage
 */
export function readLocalEntry(
  collectionName: string,
  entryId: string | number,
  options: AtMyAppClientOptions,
): SnapshotEntry | null {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return null;
  }

  const entryPath = modules.path.join(
    basePath,
    "collections",
    collectionName,
    String(entryId),
    "entry.json",
  );

  if (!modules.fs.existsSync(entryPath)) {
    return null;
  }

  try {
    return JSON.parse(modules.fs.readFileSync(entryPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * List all entries in a collection from local storage
 */
export function listLocalEntries(
  collectionName: string,
  options: AtMyAppClientOptions,
): SnapshotEntry[] {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return [];
  }

  const collectionDir = modules.path.join(
    basePath,
    "collections",
    collectionName,
  );

  if (!modules.fs.existsSync(collectionDir)) {
    return [];
  }

  const entries: SnapshotEntry[] = [];

  try {
    const entryDirs = modules.fs.readdirSync(collectionDir, {
      withFileTypes: true,
    });

    for (const dirent of entryDirs) {
      if (!dirent.isDirectory()) continue;

      const entryPath = modules.path.join(
        collectionDir,
        dirent.name,
        "entry.json",
      );
      if (modules.fs.existsSync(entryPath)) {
        try {
          const entry = JSON.parse(modules.fs.readFileSync(entryPath, "utf-8"));
          entries.push(entry);
        } catch {
          // Skip invalid entries
        }
      }
    }
  } catch {
    return [];
  }

  return entries;
}

/**
 * Read a blob from local storage
 */
export function readLocalBlob(
  collectionName: string,
  entryId: string | number,
  blobId: string,
  options: AtMyAppClientOptions,
): Buffer | null {
  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return null;
  }

  const entryDir = modules.path.join(
    basePath,
    "collections",
    collectionName,
    String(entryId),
  );

  if (!modules.fs.existsSync(entryDir)) {
    return null;
  }

  try {
    const files = modules.fs.readdirSync(entryDir);
    const blobFile = files.find((fileName: string) =>
      fileName.startsWith(`blob_${blobId}.`),
    );

    if (blobFile) {
      return modules.fs.readFileSync(modules.path.join(entryDir, blobFile));
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * List all collections available in local storage
 */
export function listLocalCollections(options: AtMyAppClientOptions): string[] {
  const manifest = loadManifest(options);
  if (manifest) {
    return Object.keys(manifest.collections);
  }

  const modules = getNodeModules();
  const basePath = getResolvedLocalStoragePath(options);
  if (!modules || !basePath) {
    return [];
  }

  const collectionsDir = modules.path.join(basePath, "collections");

  if (!modules.fs.existsSync(collectionsDir)) {
    return [];
  }

  try {
    return modules.fs
      .readdirSync(collectionsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/**
 * Apply filter expression to entries (in-memory filtering)
 */
export function applyFilter(
  entries: SnapshotEntry[],
  filter: CollectionsFilterExpr | undefined,
): SnapshotEntry[] {
  if (!filter) {
    return entries;
  }

  return entries.filter((entry) => evaluateFilter(entry, filter));
}

function evaluateFilter(
  entry: SnapshotEntry,
  filter: CollectionsFilterExpr,
): boolean {
  switch (filter.type) {
    case "comparison":
      return evaluateComparison(entry, filter);
    case "and":
      return filter.conditions.every((c) => evaluateFilter(entry, c));
    case "or":
      return filter.conditions.some((c) => evaluateFilter(entry, c));
    case "not":
      return !evaluateFilter(entry, filter.condition);
    default:
      return true;
  }
}

function evaluateComparison(
  entry: SnapshotEntry,
  filter: Extract<CollectionsFilterExpr, { type: "comparison" }>,
): boolean {
  const { field, op, value } = filter;

  // Get the field value - handle special fields
  let fieldValue: unknown;
  if (field === "id") {
    fieldValue = entry.id;
  } else if (field === "created" || field === "createdAt") {
    fieldValue = entry.createdAt;
  } else if (field === "updated" || field === "updatedAt") {
    fieldValue = entry.updatedAt;
  } else {
    // Navigate nested paths in data (e.g., "data.name" or just "name")
    const fieldPath = field.startsWith("data.") ? field.slice(5) : field;
    fieldValue = getNestedValue(entry.data, fieldPath);
  }

  switch (op) {
    case "eq":
      return fieldValue === value;
    case "lt":
      return compare(fieldValue, value) < 0;
    case "lte":
      return compare(fieldValue, value) <= 0;
    case "gt":
      return compare(fieldValue, value) > 0;
    case "gte":
      return compare(fieldValue, value) >= 0;
    case "in":
      if (Array.isArray(value)) {
        return value.some((v) => v === fieldValue);
      }
      return false;
    default:
      return true;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Try to compare as dates if strings look like ISO dates
  if (typeof a === "string" && typeof b === "string") {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
  }

  return String(a).localeCompare(String(b));
}

/**
 * Apply ordering to entries
 */
export function applyOrder(
  entries: SnapshotEntry[],
  order: string | undefined,
): SnapshotEntry[] {
  if (!order) {
    return entries;
  }

  const parts = order.split(".");
  const field = parts[0] as "id" | "created" | "updated";
  const direction = parts[1] === "desc" ? -1 : 1;

  return [...entries].sort((a, b) => {
    let aVal: unknown;
    let bVal: unknown;

    switch (field) {
      case "id":
        aVal = a.id;
        bVal = b.id;
        break;
      case "created":
        aVal = a.createdAt;
        bVal = b.createdAt;
        break;
      case "updated":
        aVal = a.updatedAt;
        bVal = b.updatedAt;
        break;
      default:
        return 0;
    }

    return compare(aVal, bVal) * direction;
  });
}

/**
 * Apply pagination (range, limit, offset) to entries
 */
export function applyPagination(
  entries: SnapshotEntry[],
  options?: {
    range?: [number, number];
    limit?: number;
    offset?: number;
  },
): SnapshotEntry[] {
  if (!options) {
    return entries;
  }

  let result = entries;

  if (options.range) {
    const [start, end] = options.range;
    result = result.slice(start, end + 1);
  } else {
    const offset = options.offset ?? 0;
    const limit = options.limit;

    if (offset > 0) {
      result = result.slice(offset);
    }

    if (limit !== undefined) {
      result = result.slice(0, limit);
    }
  }

  return result;
}

/**
 * Convert snapshot entries to raw entry format
 */
export function toRawEntries(entries: SnapshotEntry[]): CollectionsRawEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    data: entry.data,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));
}
