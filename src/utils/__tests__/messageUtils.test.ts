import { describe, it, expect } from "vitest";
import { getMessageColor, getMessagePrefix } from "../messageUtils.js";
import type { MessageType } from "../messageUtils.js";

describe("getMessageColor", () => {
  it("maps each type to the correct color", () => {
    expect(getMessageColor("success")).toBe("green");
    expect(getMessageColor("error")).toBe("red");
    expect(getMessageColor("info")).toBe("cyan");
    expect(getMessageColor("user")).toBe("white");
    expect(getMessageColor("system")).toBe("gray");
  });

  it("returns undefined for unknown types", () => {
    expect(getMessageColor("unknown" as MessageType)).toBeUndefined();
  });
});

describe("getMessagePrefix", () => {
  it("user gets › prefix", () => {
    expect(getMessagePrefix("user")).toBe("› ");
  });

  it("system gets ⚡ prefix", () => {
    expect(getMessagePrefix("system")).toBe("⚡ ");
  });

  it("other types get empty prefix", () => {
    expect(getMessagePrefix("success")).toBe("");
    expect(getMessagePrefix("error")).toBe("");
    expect(getMessagePrefix("info")).toBe("");
  });
});
