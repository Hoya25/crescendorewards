import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { tierForCommitted } from "./tierFromCommitted.ts";

Deno.test("below 1,000 committed has no tier (pre-Bronze)", () => {
  assertEquals(tierForCommitted(0), null);
  assertEquals(tierForCommitted(999), null);
  assertEquals(tierForCommitted(null), null);
});
Deno.test("1,000 committed is Bronze", () => {
  assertEquals(tierForCommitted(1000), "Bronze");
  assertEquals(tierForCommitted(4999), "Bronze");
});
Deno.test("5,000 committed is Silver", () => {
  assertEquals(tierForCommitted(5000), "Silver");
  assertEquals(tierForCommitted(14999), "Silver");
});
Deno.test("15,000 committed is Gold", () => {
  assertEquals(tierForCommitted(15000), "Gold");
  assertEquals(tierForCommitted(39999), "Gold");
});
Deno.test("40,000 committed is Platinum", () => {
  assertEquals(tierForCommitted(40000), "Platinum");
  assertEquals(tierForCommitted(99999), "Platinum");
});
Deno.test("100,000 committed is Diamond", () => {
  assertEquals(tierForCommitted(100000), "Diamond");
  assertEquals(tierForCommitted(2_500_000), "Diamond");
});
