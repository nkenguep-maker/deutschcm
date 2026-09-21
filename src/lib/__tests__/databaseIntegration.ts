export function shouldRunDatabaseIntegrationTests(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.YEMA_RUN_DB_INTEGRATION_TESTS === "true";
}
