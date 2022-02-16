import express from "express"
import cors from "cors"
import admin from "firebase-admin"
import "dotenv/config"
import { botCommands } from "./commands"
import { getName } from "./services/members"
import { Shuffle } from "./models/member"
import { shuffleJob } from "./services/shuffle"

const serviceAccount = require("../serviceAccountKey.json")

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

botCommands(db)

shuffleJob(db)

// Initialize express
const app = express()
app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.send("Zero Sama is Up")
  db.collection("members").get()
})

app.get("/info", async (_req, res) => {
  const shuffle = await db.collection("details").doc("assignment").get()
  const shuffleData = shuffle.data() as Shuffle
  res.json([shuffleData.members, shuffleData.timeStamp])
})

app.get("/report", async (_req, res) => {
  const reportDoc = await db.collection("details").doc("report").get()
  const report = reportDoc.data()
  const shuffleDoc = await db.collection("details").doc("assignment").get()
  const { dates } = shuffleDoc.data() as Shuffle
  const endDate = dates[dates.length - 1].toDate()
  const startDate = new Date(endDate.getDate() - 7)
  res.json({ dates: { startDate, endDate }, report })
})

app.get("/reports/:username", async (req, res) => {
  const { username } = req.params
  const name = await getName(db, username)
  if (name.length == 0) res.status(400).json("Username not found")
  else {
    const member = await db.collection("members").doc(name).get()
    const memberData = member.data()
    res.json({ name, memberData })
  }
})

app.get("/members", async (_req, res) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data()
  res.json(members)
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on port ${process.env.PORT || 3000}`)
})
