import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
let allowUrls = "*"

app.use(
  cors({
    origin: ["https://issue-tracker-system.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT"],
    credentials: true,
    // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'device-remember-token', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
  })
);

// Increase payload limits to fix 413 error
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)


export { app }