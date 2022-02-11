import express from "express"
import cors from "cors"
import telegramBot from "node-telegram-bot-api"
import admin from "firebase-admin"
import { report } from "./services/report"

const { token } = require("../config.json")
const serviceAccount = require("../serviceAccountKey.json")

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore()

// Telegram Bot Code Start

const oslGroupId = -1001405263968

const bot = new telegramBot(token, {
  polling: true,
})

bot.on("message", async msg => {
  let message = msg.text
  console.log(message, oslGroupId)
})

report()

// Initialize express
const app = express()
app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.send("Zero Sama is Up")
  db.collection("members").get()
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on port ${process.env.PORT}`)
})
