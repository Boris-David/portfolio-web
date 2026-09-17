/**
 * Lire la charge utile de l'API **en la validant au passage**.
 *
 * Il n'y a volontairement aucun schéma dans ce dépôt. L'API *a* le sien — des
 * schémas Zod dont son OpenAPI dérive. En recopier un second ici créerait
 * exactement ce que l'ADR 0002 refuse : une deuxième source de vérité sur la
 * forme du contenu, qui dériverait en silence le jour où l'une des deux bouge.
 *
 * On valide donc **en lisant**. Chaque accès passe par un curseur qui connaît
 * son chemin et lève une erreur le nommant. Deux propriétés en découlent :
 *
 * - un champ qu'on ne lit jamais ne peut pas casser la construction ;
 * - un champ qu'on lit ne peut pas valoir `undefined` sans qu'on l'apprenne,
 *   avec son chemin exact, au moment du `next build`.
 *
 * C'est le contraire d'un repli silencieux : une section vide sur l'écran d'un
 * recruteur coûte infiniment plus cher qu'une construction rouge.
 */

export class ContentShapeError extends Error {
  constructor(path: string, expected: string, received: unknown) {
    super(
      `Contenu de l'API inattendu en « ${path} » : ${expected} attendu, ` +
        `reçu ${describe(received)}.`,
    );
    this.name = "ContentShapeError";
  }
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "rien";
  if (Array.isArray(value)) return `une liste de ${value.length}`;
  if (typeof value === "object") return `un objet { ${Object.keys(value).join(", ")} }`;
  return `${typeof value} ${JSON.stringify(value)}`;
}

/** Un curseur sur une valeur de la charge utile, qui se souvient d'où il vient. */
export class Field {
  constructor(
    private readonly value: unknown,
    readonly path: string,
  ) {}

  static root(value: unknown, name: string): Field {
    return new Field(value, name);
  }

  /** Descend dans une propriété. Le chemin s'allonge, même si la valeur manque. */
  child(key: string): Field {
    const path = `${this.path}.${key}`;
    if (typeof this.value !== "object" || this.value === null || Array.isArray(this.value)) {
      throw new ContentShapeError(this.path, "un objet", this.value);
    }
    return new Field((this.value as Record<string, unknown>)[key], path);
  }

  /** Vrai si la valeur est présente et non nulle — `null` est une absence explicite. */
  get isPresent(): boolean {
    return this.value !== undefined && this.value !== null;
  }

  text(): string {
    if (typeof this.value !== "string" || this.value === "") {
      throw new ContentShapeError(this.path, "une chaîne non vide", this.value);
    }
    return this.value;
  }

  /** Une chaîne, ou `null` quand l'API marque explicitement l'absence. */
  textOrNull(): string | null {
    return this.isPresent ? this.text() : null;
  }

  integer(): number {
    if (typeof this.value !== "number" || !Number.isInteger(this.value)) {
      throw new ContentShapeError(this.path, "un entier", this.value);
    }
    return this.value;
  }

  /**
   * La liste, curseurs compris. Une liste **vide** est refusée par défaut :
   * dans ce contenu, aucune collection n'a de raison d'être vide, et une
   * section qui disparaît sans rien casser est une panne silencieuse.
   */
  list(options: { readonly allowEmpty?: boolean } = {}): readonly Field[] {
    if (!Array.isArray(this.value)) {
      throw new ContentShapeError(this.path, "une liste", this.value);
    }
    if (this.value.length === 0 && options.allowEmpty !== true) {
      throw new ContentShapeError(this.path, "une liste non vide", this.value);
    }
    return this.value.map((item, index) => new Field(item, `${this.path}[${index}]`));
  }

  /** La liste si elle est là, vide sinon — pour les collections réellement facultatives. */
  listOrEmpty(): readonly Field[] {
    return this.isPresent ? this.list({ allowEmpty: true }) : [];
  }

  /** Une valeur contrainte à un jeu fini : tout le reste est une erreur, jamais un défaut. */
  oneOf<T extends string>(allowed: readonly T[]): T {
    const text = this.text();
    if (!(allowed as readonly string[]).includes(text)) {
      throw new ContentShapeError(this.path, `l'une de [${allowed.join(", ")}]`, text);
    }
    return text as T;
  }
}
