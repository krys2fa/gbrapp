import { GET } from "../destinations/route";
import { NextRequest } from "next/server";

// Mock prisma
jest.mock("@/app/lib/prisma", () => ({
  __esModule: true,
  default: {
    jobCard: {
      groupBy: jest.fn(() =>
        Promise.resolve([
          { destinationCountry: "GH", _count: { _all: 10 } },
          { destinationCountry: "NG", _count: { _all: 5 } },
        ])
      ),
    },
    largeScaleJobCard: {
      groupBy: jest.fn(() =>
        Promise.resolve([
          { destinationCountry: "GH", _count: { _all: 4 } },
          { destinationCountry: null, _count: { _all: 2 } },
        ])
      ),
    },
  },
}));

describe("GET /api/analytics/destinations", () => {
  it("returns pivoted counts and Other bucket correctly", async () => {
    const req = new NextRequest(
      "http://localhost/api/analytics/destinations?top=1"
    );
    const res = await GET(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.countries)).toBe(true);
    // top=1 should include top country and Other bucket
    expect(json.countries.length).toBeGreaterThanOrEqual(1);
    const gh = json.countries.find((c: any) => c.countryCode === "GH");
    expect(gh.largeCount).toBe(4);
    expect(gh.smallCount).toBe(10);
  });
});
