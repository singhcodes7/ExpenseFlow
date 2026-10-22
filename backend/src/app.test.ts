
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./app.js";

describe("Authentication API", () => {
    
it("should reject access to profile without authentication", async () => {
    const response = await request(app)
        .get("/profile")
        .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(401);
});
});
