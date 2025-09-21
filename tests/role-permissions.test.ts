import { hasActionPermission } from "../app/lib/role-permissions";

describe("role-permissions", () => {
  test("SUPERADMIN has full permissions", () => {
    expect(
      hasActionPermission("SUPERADMIN" as any, "job-cards", "delete")
    ).toBe(true);
  });

  test("SMALL_SCALE_ASSAYER cannot approve pending approvals", () => {
    expect(
      hasActionPermission(
        "SMALL_SCALE_ASSAYER" as any,
        "pending-approvals" as any,
        "approve" as any
      )
    ).toBe(false);
  });
});
