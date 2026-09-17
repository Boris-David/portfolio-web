import { describe, expect, it } from "vitest";
import { parseRichText, plainText } from "@/content/rich-text";

describe("parseRichText", () => {
  it("rend un texte sans balisage en un seul nœud", () => {
    expect(parseRichText("Rien à signaler")).toEqual([
      { kind: "text", value: "Rien à signaler" },
    ]);
  });

  it("isole le gras et garde le texte autour", () => {
    expect(parseRichText("j'ai **tenu seul** la billettique")).toEqual([
      { kind: "text", value: "j'ai " },
      { kind: "strong", value: "tenu seul" },
      { kind: "text", value: " la billettique" },
    ]);
  });

  it("isole le code", () => {
    expect(parseRichText("passé en `async/await` ici")).toEqual([
      { kind: "text", value: "passé en " },
      { kind: "code", value: "async/await" },
      { kind: "text", value: " ici" },
    ]);
  });

  it("gère plusieurs emphases dans la même phrase", () => {
    const nodes = parseRichText("**un**, puis `deux`, puis **trois**");
    expect(nodes.filter((node) => node.kind === "strong")).toHaveLength(2);
    expect(nodes.filter((node) => node.kind === "code")).toHaveLength(1);
  });

  it("laisse une astérisque isolée en texte plutôt que d'ouvrir un gras", () => {
    expect(parseRichText("2 ** 3 vaut 8")).toEqual([{ kind: "text", value: "2 ** 3 vaut 8" }]);
  });

  it("ne produit jamais de nœud contenant du HTML", () => {
    const nodes = parseRichText("**<script>alert(1)</script>** est du texte");
    expect(nodes[0]).toEqual({ kind: "strong", value: "<script>alert(1)</script>" });
  });
});

describe("plainText", () => {
  it("retire le balisage pour les attributs qui n'acceptent pas de balise", () => {
    expect(plainText("la **billettique** en `Swift`")).toBe("la billettique en Swift");
  });
});
