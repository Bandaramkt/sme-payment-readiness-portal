const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------------------------
   Database connection
---------------------------------- */

const db = new Database("portal.db");

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

/* ---------------------------------
   Database tables
---------------------------------- */

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    business_category TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    business_category TEXT NOT NULL,
    overall_score INTEGER NOT NULL,
    readiness_level TEXT NOT NULL,
    dpa_score INTEGER NOT NULL,
    ia_score INTEGER NOT NULL,
    dfl_score INTEGER NOT NULL,
    pu_score INTEGER NOT NULL,
    priority_area TEXT NOT NULL,
    strongest_area TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    assessment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

/* ---------------------------------
   Middleware
---------------------------------- */

app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "sme-payment-readiness-portal-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

/* ---------------------------------
   Factor names and recommendations
---------------------------------- */

const factorNames = {
  dpa: "Digital Payment Adoption",
  ia: "Infrastructure Availability",
  dfl: "Digital Financial Literacy",
  pu: "Perceived Usefulness"
};

const recommendations = {
  dpa:
    "Use suitable QR, mobile banking, or POS payment methods more consistently in daily business activities.",

  ia:
    "Improve internet reliability, maintain suitable payment devices, and arrange backup connectivity and technical support.",

  dfl:
    "Provide practical training on transaction verification, digital security, fraud awareness, and failed payments.",

  pu:
    "Identify how digital payments can improve transaction speed, customer convenience, record keeping, and financial control."
};

/* ---------------------------------
   Login-checking middleware
---------------------------------- */

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "Please log in to access this feature."
    });
  }

  next();
}

/* ---------------------------------
   User registration
---------------------------------- */

app.post("/api/register", async (req, res) => {
  try {
    const {
      businessName,
      businessCategory,
      email,
      password
    } = req.body;

    if (
      !businessName ||
      !businessCategory ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        error: "Please complete all registration fields."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must contain at least six characters."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        error: "An account already exists with this email."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db
      .prepare(`
        INSERT INTO users (
          business_name,
          business_category,
          email,
          password
        )
        VALUES (?, ?, ?, ?)
      `)
      .run(
        businessName.trim(),
        businessCategory.trim(),
        cleanEmail,
        hashedPassword
      );

    req.session.userId = result.lastInsertRowid;

    res.status(201).json({
      message: "Registration successful.",
      user: {
        id: result.lastInsertRowid,
        businessName: businessName.trim(),
        businessCategory: businessCategory.trim(),
        email: cleanEmail
      }
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      error: "Registration could not be completed."
    });
  }
});

/* ---------------------------------
   User login
---------------------------------- */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Please enter your email and password."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsCorrect) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    req.session.userId = user.id;

    res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        businessName: user.business_name,
        businessCategory: user.business_category,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Login could not be completed."
    });
  }
});

/* ---------------------------------
   Check current user
---------------------------------- */

app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({
      loggedIn: false
    });
  }

  const user = db
    .prepare(`
      SELECT
        id,
        business_name,
        business_category,
        email
      FROM users
      WHERE id = ?
    `)
    .get(req.session.userId);

  if (!user) {
    req.session.destroy();

    return res.json({
      loggedIn: false
    });
  }

  res.json({
    loggedIn: true,
    user: {
      id: user.id,
      businessName: user.business_name,
      businessCategory: user.business_category,
      email: user.email
    }
  });
});

/* ---------------------------------
   Logout
---------------------------------- */

app.post("/api/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) {
      return res.status(500).json({
        error: "Logout could not be completed."
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "Logout successful."
    });
  });
});

/* ---------------------------------
   Readiness assessment
---------------------------------- */

app.post("/api/assess", requireLogin, (req, res) => {
  try {
    const answers = req.body.answers;

    if (
      !Array.isArray(answers) ||
      answers.length !== 12 ||
      answers.some(
        answer =>
          typeof answer !== "number" ||
          answer < 1 ||
          answer > 5
      )
    ) {
      return res.status(400).json({
        error: "Please answer all 12 questions."
      });
    }

    const user = db
      .prepare(`
        SELECT business_category
        FROM users
        WHERE id = ?
      `)
      .get(req.session.userId);

    if (!user) {
      return res.status(404).json({
        error: "User account could not be found."
      });
    }

    const answerGroups = {
      dpa: answers.slice(0, 3),
      ia: answers.slice(3, 6),
      dfl: answers.slice(6, 9),
      pu: answers.slice(9, 12)
    };

    const scores = {};

    for (const factor in answerGroups) {
      const total = answerGroups[factor].reduce(
        (sum, value) => sum + value,
        0
      );

      scores[factor] = Math.round(
        (total / (answerGroups[factor].length * 5)) *
          100
      );
    }

    const weights = {
      dpa: 0.289,
      ia: 0.304,
      dfl: 0.225,
      pu: 0.182
    };

    const overallScore = Math.round(
      scores.dpa * weights.dpa +
        scores.ia * weights.ia +
        scores.dfl * weights.dfl +
        scores.pu * weights.pu
    );

    const priorityFactor = Object.keys(scores).reduce(
      (lowest, factor) =>
        scores[factor] < scores[lowest]
          ? factor
          : lowest
    );

    const strongestFactor = Object.keys(scores).reduce(
      (highest, factor) =>
        scores[factor] > scores[highest]
          ? factor
          : highest
    );

    let readinessLevel;

    if (overallScore >= 80) {
      readinessLevel = "Advanced";
    } else if (overallScore >= 60) {
      readinessLevel = "Developing";
    } else {
      readinessLevel = "Needs Improvement";
    }

    const priorityArea = factorNames[priorityFactor];
    const strongestArea = factorNames[strongestFactor];
    const recommendation =
      recommendations[priorityFactor];

    const result = db
      .prepare(`
        INSERT INTO assessments (
          user_id,
          business_category,
          overall_score,
          readiness_level,
          dpa_score,
          ia_score,
          dfl_score,
          pu_score,
          priority_area,
          strongest_area,
          recommendation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.session.userId,
        user.business_category,
        overallScore,
        readinessLevel,
        scores.dpa,
        scores.ia,
        scores.dfl,
        scores.pu,
        priorityArea,
        strongestArea,
        recommendation
      );

    res.json({
      assessmentId: result.lastInsertRowid,
      saved: true,
      overallScore,
      readinessLevel,
      scores,
      priorityArea,
      strongestArea,
      recommendation
    });
  } catch (error) {
    console.error("Assessment error:", error);

    res.status(500).json({
      error: "The assessment could not be saved."
    });
  }
});

/* ---------------------------------
   Assessment history
---------------------------------- */

app.get("/api/history", requireLogin, (req, res) => {
  try {
    const assessments = db
      .prepare(`
        SELECT
          id,
          business_category AS businessCategory,
          overall_score AS overallScore,
          readiness_level AS readinessLevel,
          dpa_score AS dpaScore,
          ia_score AS iaScore,
          dfl_score AS dflScore,
          pu_score AS puScore,
          priority_area AS priorityArea,
          strongest_area AS strongestArea,
          recommendation,
          assessment_date AS assessmentDate
        FROM assessments
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(req.session.userId);

    res.json({
      assessments
    });
  } catch (error) {
    console.error("History error:", error);

    res.status(500).json({
      error: "Assessment history could not be loaded."
    });
  }
});

/* ---------------------------------
   Progress comparison
---------------------------------- */

app.get("/api/progress", requireLogin, (req, res) => {
  try {
    const assessments = db
      .prepare(`
        SELECT
          id,
          overall_score AS overallScore,
          dpa_score AS dpaScore,
          ia_score AS iaScore,
          dfl_score AS dflScore,
          pu_score AS puScore,
          readiness_level AS readinessLevel,
          assessment_date AS assessmentDate
        FROM assessments
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 2
      `)
      .all(req.session.userId);

    if (assessments.length === 0) {
      return res.json({
        message: "No assessment results are available.",
        current: null,
        previous: null,
        change: null
      });
    }

    const current = assessments[0];
    const previous =
      assessments.length > 1 ? assessments[1] : null;

    if (!previous) {
      return res.json({
        message:
          "Complete another assessment to view your progress.",
        current,
        previous: null,
        change: null
      });
    }

    const change = {
      overallScore:
        current.overallScore - previous.overallScore,

      dpaScore:
        current.dpaScore - previous.dpaScore,

      iaScore:
        current.iaScore - previous.iaScore,

      dflScore:
        current.dflScore - previous.dflScore,

      puScore:
        current.puScore - previous.puScore
    };

    res.json({
      message:
        change.overallScore > 0
          ? "Your overall readiness has improved."
          : change.overallScore < 0
          ? "Your overall readiness score has decreased."
          : "Your overall readiness score has not changed.",
      current,
      previous,
      change
    });
  } catch (error) {
    console.error("Progress error:", error);

    res.status(500).json({
      error: "Progress information could not be loaded."
    });
  }
});

/* ---------------------------------
   Frontend page
---------------------------------- */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

/* ---------------------------------
   Start server
---------------------------------- */

app.listen(PORT, () => {
  console.log(`Portal is running on port ${PORT}`);
  console.log("Database is ready.");
});