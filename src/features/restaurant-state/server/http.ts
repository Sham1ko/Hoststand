import type * as z from "zod";

import type { RestaurantMutationResult } from "./restaurant-store";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
) {
  const body = (await request.json().catch(() => null)) as unknown;
  const result = schema.safeParse(body);

  return result.success ? result.data : null;
}

export function invalidPayloadResponse() {
  return Response.json({ error: "Invalid request data" }, { status: 400 });
}

export function mutationErrorResponse<T>(
  result: Exclude<RestaurantMutationResult<T>, { status: "ok" }>,
  resourceName: string,
) {
  if (result.status === "not_found") {
    return Response.json(
      { error: `${resourceName} not found` },
      { status: 404 },
    );
  }

  return Response.json(
    { error: `${resourceName} conflicts with the restaurant state` },
    { status: 409 },
  );
}
