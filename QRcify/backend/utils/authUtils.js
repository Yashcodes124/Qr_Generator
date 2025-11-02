import jwt from "jsonwebtoken";

export const generateAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

export const verifyAuthToken = (token) => {
  {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  }
};
