import { describe, expect, it } from "vitest";
import { shouldRunDatabaseIntegrationTests } from "./databaseIntegration";

describe("database integration test gate", () => {
  it("runs only when explicitly enabled", () => {
    expect(shouldRunDatabaseIntegrationTests({})).toBe(false);
    expect(shouldRunDatabaseIntegrationTests({ YEMA_RUN_DB_INTEGRATION_TESTS: "false" })).toBe(false);
    expect(shouldRunDatabaseIntegrationTests({ YEMA_RUN_DB_INTEGRATION_TESTS: "true" })).toBe(true);
  });
});
