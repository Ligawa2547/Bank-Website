// lib/zod-shim.ts
// A simple re-export so that any deep import like “zod/v4” still works.

export * from "zod"
export { default } from "zod"

// Shim to handle zod v4 imports that don't exist in the current version
