import { evaluateRedirect } from "../app/lib/auth-utils";

describe("auth-utils evaluateRedirect", () => {
  test("FINANCE should be redirected away from /setup to dashboard", () => {
    const res = evaluateRedirect("FINANCE" as any, "/setup");
    expect(res.shouldRedirect).toBe(true);
    expect(res.redirectTo).toBe("/dashboard");
    expect(res.message).toMatch(/You don't have access to/);
  });

  test("ADMIN should be allowed on /setup", () => {
    const res = evaluateRedirect("ADMIN" as any, "/setup");
    expect(res.shouldRedirect).toBe(false);
  });

  test("LARGE_SCALE_ASSAYER cannot access /setup and gets large-scale message for job-cards/large-scale", () => {
    const res1 = evaluateRedirect("LARGE_SCALE_ASSAYER" as any, "/setup");
    expect(res1.shouldRedirect).toBe(true);

    const res2 = evaluateRedirect(
      "LARGE_SCALE_ASSAYER" as any,
      "/job-cards/large-scale/new"
    );
    expect(res2.shouldRedirect).toBe(false);
  });
});
