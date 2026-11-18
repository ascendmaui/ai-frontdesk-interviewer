import { NextResponse } from "next/server";

/**
 * Wrap a route handler so unexpected failures (e.g. storage unavailable)
 * return a generic JSON error instead of an opaque 500 / stack leak.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withApiErrors<A extends any[]>(
  name: string,
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      console.error(`[api] ${name} failed`, e);
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }
  };
}
