import { describe, expect, it } from "vitest";
import { parseRichText, plainText } from "@/content/rich-text";

describe("parseRichText", () => {
  it("renders text without markup as a single node", () => {
    expect(parseRichText("Rien à signaler")).toEqual([
      { kind: "text", value: "Rien à signaler" },
    ]);
  });

  it("isolates bold and keeps the text around it", () => {
    expect(parseRichText("j'ai **tenu seul** la billettique")).toEqual([
      { kind: "text", value: "j'ai " },
      { kind: "strong", value: "tenu seul" },
      { kind: "text", value: " la billettique" },
    ]);
  });

  it("isolates code", () => {
    expect(parseRichText("passé en `async/await` ici")).toEqual([
      { kind: "text", value: "passé en " },
      { kind: "code", value: "async/await" },
      { kind: "text", value: " ici" },
    ]);
  });

  it("handles several emphases in the same sentence", () => {
    const nodes = parseRichText("**un**, puis `deux`, puis **trois**");
    expect(nodes.filter((node) => node.kind === "strong")).toHaveLength(2);
    expect(nodes.filter((node) => node.kind === "code")).toHaveLength(1);
  });

  it("leaves a lone asterisk as text rather than opening a bold run", () => {
    expect(parseRichText("2 ** 3 vaut 8")).toEqual([{ kind: "text", value: "2 ** 3 vaut 8" }]);
  });

  it("never produces a node containing HTML", () => {
    const nodes = parseRichText("**<script>alert(1)</script>** est du texte");
    expect(nodes[0]).toEqual({ kind: "strong", value: "<script>alert(1)</script>" });
  });
});

describe("plainText", () => {
  it("strips the markup for attributes that accept no tag", () => {
    expect(plainText("la **billettique** en `Swift`")).toBe("la billettique en Swift");
  });
});
