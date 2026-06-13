import { describe, expect, it } from "vitest";
import { splitTelegramMessage } from "../Telegram/format.js";

describe("splitTelegramMessage", () => {
  it("keeps short messages unchanged", () => {
    expect(splitTelegramMessage("hello", 10)).toEqual(["hello"]);
  });

  it("splits long messages under the requested limit", () => {
    const chunks = splitTelegramMessage("aaa\nbbb\nccc\nddd", 7);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 7)).toBe(true);
    expect(chunks.join("\n")).toBe("aaa\nbbb\nccc\nddd");
  });

  it("splits long words when no newline is available", () => {
    const chunks = splitTelegramMessage("abcdefghij", 4);

    expect(chunks).toEqual(["abcd", "efgh", "ij"]);
  });
});
