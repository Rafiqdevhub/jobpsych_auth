import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    api: "JobPsych API",
    description: "A basic API server.",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    features: [],
    endpoints: [],
    documentation: "Basic server.",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "jobpsych-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`JobPsych running on http://localhost:${PORT}`);
});

export default app;
