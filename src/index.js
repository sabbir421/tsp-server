const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const sequelize = require("./config/database");
require("./schema");
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const requirementRoutes = require("./routes/requirementRoutes");
const matchRoutes = require("./routes/matchRoutes");
const { errorResponse } = require("./utils/response");

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  "https://truespaceproperty.com",
  "https://www.truespaceproperty.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

if (process.env.CLIENT_URL) {
  const customUrl = process.env.CLIENT_URL.replace(/\/$/, "");
  if (!allowedOrigins.includes(customUrl)) {
    allowedOrigins.push(customUrl);
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/(.*\.)?truespaceproperty\.com$/.test(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }

    // Dynamic origin reflection fallback to avoid CORS blocks
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "RSC",
    "Next-Router-State-Tree",
    "Next-Router-Prefetch",
    "Next-Url",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", cors(corsOptions), express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "TrueSpace Property API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/matches", matchRoutes);

app.use((req, res) => {
  errorResponse(res, "Route not found", 404);
});

app.use((err, req, res, next) => {
  console.error(err);
  errorResponse(res, "Internal server error", 500);
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully");
    await sequelize.sync({ alter: true });

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Run: lsof -ti:${PORT} | xargs kill -9`
        );
        console.error("Or set a different PORT in server/.env");
      } else {
        console.error("Failed to start server:", error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
