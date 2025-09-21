"use client";

import { useAuth } from "@/app/context/auth-context";

/**
 * API utility for making authenticated requests
 */
export class ApiClient {
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token || null;
  }

  /**
   * Set the authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Make an authenticated GET request
   */
  async get(url: string, options: RequestInit = {}): Promise<any> {
    return this.request(url, {
      method: "GET",
      ...options,
    });
  }

  /**
   * Make an authenticated POST request
   */
  async post(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.request(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make an authenticated PUT request
   */
  async put(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.request(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make an authenticated DELETE request
   */
  async delete(url: string, options: RequestInit = {}): Promise<any> {
    return this.request(url, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Make an authenticated request with automatic token inclusion
   */
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    const headers = new Headers(options.headers);

    // Add JSON content type for requests with body
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add authorization header if token is available
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      // Ensure cookies are sent by default so server-side cookie auth works
      credentials: options.credentials || "include",
    };

    const res = await fetch(url, requestOptions);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }

    // Return text for non-JSON responses
    return res.text();
  }
}

// Create a singleton instance
let apiClient: ApiClient | null = null;

/**
 * Get the API client instance with current auth token
 */
export function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient();
  }

  // Try to get token from localStorage if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth-token");
    if (token) {
      apiClient.setToken(token);
    }
  }

  return apiClient;
}

/**
 * Hook to get an authenticated API client
 */
export function useApiClient() {
  const { token } = useAuth();

  const client = getApiClient();
  if (token) {
    client.setToken(token);
  }

  return client;
}

/**
 * Utility function to make authenticated API calls
 */
export const api = {
  get: (url: string, options?: RequestInit) => getApiClient().get(url, options),
  post: (url: string, data?: any, options?: RequestInit) =>
    getApiClient().post(url, data, options),
  put: (url: string, data?: any, options?: RequestInit) =>
    getApiClient().put(url, data, options),
  delete: (url: string, options?: RequestInit) =>
    getApiClient().delete(url, options),
};
