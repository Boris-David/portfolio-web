/**
 * Reading the API payload **and validating it on the way through**.
 *
 * There is deliberately no schema in this repository. The API *has* one — Zod
 * schemas its OpenAPI derives from. Copying a second one over here would create
 * exactly what ADR 0002 rules out: a second source of truth about the shape of
 * the content, which would silently drift the day either one moves.
 *
 * So we validate **while reading**. Every access goes through a cursor that
 * knows its own path and raises an error naming it. Two properties follow:
 *
 * - a field we never read cannot break the build;
 * - a field we do read cannot be `undefined` without us finding out, with its
 *   exact path, at `next build` time.
 *
 * This is the opposite of a silent fallback: an empty section on a recruiter's
 * screen costs infinitely more than a red build.
 */

export class ContentShapeError extends Error {
  constructor(path: string, expected: string, received: unknown) {
    super(
      `Unexpected API content at “${path}”: expected ${expected}, ` +
        `received ${describe(received)}.`,
    );
    this.name = "ContentShapeError";
  }
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "nothing";
  if (Array.isArray(value)) return `a list of ${value.length}`;
  if (typeof value === "object") return `an object { ${Object.keys(value).join(", ")} }`;
  return `${typeof value} ${JSON.stringify(value)}`;
}

/** A cursor onto a value in the payload, which remembers where it came from. */
export class Field {
  constructor(
    private readonly value: unknown,
    readonly path: string,
  ) {}

  static root(value: unknown, name: string): Field {
    return new Field(value, name);
  }

  /** Descends into a property. The path grows, even when the value is missing. */
  child(key: string): Field {
    const path = `${this.path}.${key}`;
    if (typeof this.value !== "object" || this.value === null || Array.isArray(this.value)) {
      throw new ContentShapeError(this.path, "an object", this.value);
    }
    return new Field((this.value as Record<string, unknown>)[key], path);
  }

  /** True when the value is present and not null — `null` is an explicit absence. */
  get isPresent(): boolean {
    return this.value !== undefined && this.value !== null;
  }

  text(): string {
    if (typeof this.value !== "string" || this.value === "") {
      throw new ContentShapeError(this.path, "a non-empty string", this.value);
    }
    return this.value;
  }

  /** A string, or `null` when the API explicitly marks the absence. */
  textOrNull(): string | null {
    return this.isPresent ? this.text() : null;
  }

  integer(): number {
    if (typeof this.value !== "number" || !Number.isInteger(this.value)) {
      throw new ContentShapeError(this.path, "an integer", this.value);
    }
    return this.value;
  }

  /**
   * The list, cursors included. An **empty** list is rejected by default: in
   * this content, no collection has any reason to be empty, and a section that
   * vanishes without breaking anything is a silent failure.
   */
  list(options: { readonly allowEmpty?: boolean } = {}): readonly Field[] {
    if (!Array.isArray(this.value)) {
      throw new ContentShapeError(this.path, "a list", this.value);
    }
    if (this.value.length === 0 && options.allowEmpty !== true) {
      throw new ContentShapeError(this.path, "a non-empty list", this.value);
    }
    return this.value.map((item, index) => new Field(item, `${this.path}[${index}]`));
  }

  /** The list if it is there, empty otherwise — for genuinely optional collections. */
  listOrEmpty(): readonly Field[] {
    return this.isPresent ? this.list({ allowEmpty: true }) : [];
  }

  /** A value constrained to a finite set: anything else is an error, never a default. */
  oneOf<T extends string>(allowed: readonly T[]): T {
    const text = this.text();
    if (!(allowed as readonly string[]).includes(text)) {
      throw new ContentShapeError(this.path, `one of [${allowed.join(", ")}]`, text);
    }
    return text as T;
  }
}
