import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { ALLOWED_ORIGIN } from "./config.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";
import categoriesRouter from "./routes/categories.js";
import expensesRouter from "./routes/expenses.js";
import incomeRouter from "./routes/income.js";
import adminRouter from "./routes/admin.js";
import registrationRouter from "./routes/registration.js";
import sessionRouter from "./routes/session.js";
import profileRouter from "./routes/profile.js";
import passwordRouter from "./routes/password.js";
import budgetRouter from "./routes/budgets.js";

const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'https://expense-flow-tau-livid.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use(csrfProtection);

app.use("/api", budgetRouter);
app.use(categoriesRouter);
app.use(expensesRouter);
app.use(incomeRouter);
app.use(adminRouter);
app.use(registrationRouter);
app.use(sessionRouter);
app.use(profileRouter);
app.use(passwordRouter);

app.use(errorHandler);

export default app;