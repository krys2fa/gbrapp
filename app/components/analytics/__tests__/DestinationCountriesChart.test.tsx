/* eslint-disable */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DestinationCountriesChart from "../DestinationCountriesChart";

const mockResponse = {
  success: true,
  countries: [
    {
      countryCode: "GH",
      countryName: "Ghana",
      largeCount: 4,
      smallCount: 10,
      total: 14,
    },
    {
      countryCode: "NG",
      countryName: "Nigeria",
      largeCount: 2,
      smallCount: 5,
      total: 7,
    },
  ],
};

describe("DestinationCountriesChart", () => {
  beforeEach(() => {
    // @ts-expect-error mock fetch for tests
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) })
    );
  });

  afterEach(() => {
    // @ts-expect-error restore mock if present
    global.fetch.mockRestore && global.fetch.mockRestore();
  });

  it("renders and displays chart title", async () => {
    render(<DestinationCountriesChart />);
    expect(
      screen.getByText(/Destination countries by job-card scale/i)
    ).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
