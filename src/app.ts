import express from "express"
import cors from "cors"
import admin from "firebase-admin"
import "dotenv/config"
import { botCommands } from "./commands"

const serviceAccount = require("../serviceAccountKey.json")

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

botCommands(db)

// Initialize express
const app = express()
app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.send("Zero Sama is Up")
  db.collection("members").get()
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on port ${process.env.PORT || 3000}`)
})
