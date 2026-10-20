import { describe, expect, it } from "vitest";
import { PUBLIC_NAV_ITEMS } from "../client/src/lib/publicShell";

describe("public navigation shell", () => {
  it("keeps the five reference sections in the expected order", () => {
    expect(PUBLIC_NAV_ITEMS.map(({ label }) => label)).toEqual([
      "Explore",
      "Schedule",
      "Trails",
      "Community",
      "Profile",
    ]);
  });

  it("uses stable routes for every public section", () => {
    expect(PUBLIC_NAV_ITEMS.map(({ path }) => path)).toEqual([
      "/",
      "/schedule",
      "/trails",
      "/community",
      "/profile",
    ]);
  });
});
