import request from "supertest";
import { app } from "../app.js";
import { User } from "../models/usersModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

describe("Test @POST /api/users/login", () => {
  const signInData = {
    email: "marvin@example.com",
    password: "examplepassword",
  };

  const mockUserId = "mockUserId";
  const mockUser = {
    _id: mockUserId,
    email: signInData.email,
    password: bcrypt.hashSync(signInData.password, 10),
    subscription: "starter",
    token: "mockToken",
  };

  beforeAll(() => {
    // Mock User.findOne
    jest.spyOn(User, "findOne").mockImplementation(({ email }) => {
      if (email === signInData.email) {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    });

    // Mock bcrypt.compare
    jest
      .spyOn(bcrypt, "compare")
      .mockImplementation((password, hashedPassword) => {
        return Promise.resolve(
          password === signInData.password &&
            hashedPassword === mockUser.password
        );
      });

    // Mock jwt.sign
    jest.spyOn(jwt, "sign").mockImplementation(() => "mockJwtToken");

    // Mock User.findByIdAndUpdate
    jest.spyOn(User, "findByIdAndUpdate").mockImplementation((id, update) => {
      if (id === mockUserId) {
        return Promise.resolve({ ...mockUser, ...update });
      }
      return Promise.resolve(null);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("test signin with correctData", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send(signInData);

    console.log(signInData, signInData.email, signInData.password);
    console.log("Response status code:", response.status);
    console.log("Response body:", response.body);
    console.log("Response body USER:", response.body.user);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(signInData.email);
    expect(response.body).toHaveProperty("token", "mockJwtToken");
  });

  test("should return 401 with wrong email or password", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "wrong@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Email or password is wrong"
    );
  });
});