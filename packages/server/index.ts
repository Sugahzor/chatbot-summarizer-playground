import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => res.send("Hello World, meow!"));

app.get("/api/hello", (req: Request, res: Response) =>
  res.json({ message: "Hello from the API!" }),
);

app.listen(port, () =>
  console.log(`Server up and running on port http://localhost:${port}`),
);
