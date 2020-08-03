import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import telegramBot from "node-telegram-bot-api"
import firebase from "firebase"
import admin from "firebase-admin"

type Members = Record<string, string>

interface MembersData {
  membersList: string[]
  usernames: Record<string, string>
  chatId: Record<number, string>
  memberNameChatIdMap: Record<string, string>
}

const { token } = require("./config.json")
const {
  membersList,
  usernames,
  chatId,
  memberNameChatIdMap
}: MembersData = require("./data.json")
const firebaseConfig = require("./firebaseConfig.json")
const serviceAccount = require("./serviceAccountKey.json")

// Initialize Express
const app = express()
app.use(bodyParser.json())
app.use(cors())

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

const shuffleDocRef = db.collection("members").doc("0")

function shuffle(array: string[]) {
  let currentIndex = array.length,
    temporaryValue: string,
    randomIndex: number

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

var reporter = [...membersList]
var source = [...membersList]

const shuffleMembers = () => {
  shuffle(reporter)
  let reportSourceMap: Members = {}
  let count = 0
  while (count < 2 * source.length) {
    for (let i = 0; i < source.length; i++) {
      if (source[i] === reporter[i]) {
        count = 0
        i = 0
        shuffle(reporter)
      } else {
        count += 1
      }
    }
  }
  for (let i = 0; i < source.length; i++)
    reportSourceMap[source[i]] = reporter[i]
  Object.keys(reportSourceMap).forEach(member => {
    if (
      reportSourceMap[member] ===
      reportSourceMap[reportSourceMap[reportSourceMap[member]]]
    ) {
      shuffleMembers()
    }
  })
}

// Shuffles the members list on every Saturday

setInterval(() => {
  let date = new Date()
  if (date.getDay() === 6 && date.getHours() === 1 && date.getMinutes() === 0) {
    date.setDate(date.getDate() + 1)
    shuffleMembers()
    let sourceReporterMap: Members = {}
    for (let i = 0; i < reporter.length; i++)
      sourceReporterMap[source[i]] = reporter[i]
    shuffleDocRef.update({
      members: sourceReporterMap,
      timeStamp: new Date(),
      dates: FieldValue.arrayUnion(date)
    })
    for (let i = 0; i < reporter.length; i++) {
      db.collection("members")
        .doc(reporter[i])
        .set(
          {
            [date.toString()]: {
              reporter: source[i]
            }
          },
          { merge: true }
        )
    }
  }
}, 1000 * 60)

// Telegram Bot Code Start

const oslGroupId = -1001405263968

const bot = new telegramBot(token, {
  polling: true
})

interface ResponseCallbacks {
  [key: number]: (answer: telegramBot.Message) => void
}

var responseCallbacks: ResponseCallbacks = {}

interface Shuffle {
  dates: firebase.firestore.Timestamp[]
  members: Members
  timeStamp: Date
}

interface WeekData {
  fun: string
  future: string
  osl: string
  past: string
  reporter: string
  timeStamp: firebase.firestore.Timestamp
}

interface MemberData {
  [key: string]: WeekData
}

// Sends a message to every member about there source of the week

setInterval(async () => {
  let date = new Date()
  if (
    date.getDay() === 0 &&
    date.getHours() === 3 &&
    date.getMinutes() === 30
  ) {
    const shuffle = await shuffleDocRef.get()
    const shuffleData = shuffle.data() as Shuffle
    const memberMap = shuffleData.members
    reporter.forEach(member => {
      bot.sendMessage(
        memberNameChatIdMap[member],
        `Hey there, hope you are doing well. Your source for the week is ${memberMap[member]}!
Please use the /report command to send in your report.`
      )
    })
  }
}, 1000 * 60)

// Sends a reminder to the members who haven't submitted there reports yet

setInterval(async () => {
  let date = new Date()
  if (
    date.getDay() === 1 &&
    date.getHours() === 3 &&
    date.getMinutes() === 30
  ) {
    const shuffle = await shuffleDocRef.get()
    const shuffleData = shuffle.data() as Shuffle
    const dates = shuffleData.dates
    const date = dates[dates.length - 1].toDate().toString()
    source.forEach(async member => {
      let memberDoc = await db
        .collection("members")
        .doc(member)
        .get()
      let memberData = memberDoc.data() as MemberData
      if (memberData[date].timeStamp === undefined) {
        let reporterName = memberData[date].reporter
        bot.sendMessage(
          memberNameChatIdMap[reporterName],
          `Hey there, This is a gentle reminder. Please submit your report soon using the /report command.`
        )
      }
    })
  }
}, 1000 * 60)

// Sends a list of members who haven't reported yet in the main group

setInterval(async () => {
  let date = new Date()
  if (
    date.getDay() === 1 &&
    date.getHours() === 12 &&
    date.getMinutes() === 30
  ) {
    const shuffle = await shuffleDocRef.get()
    const shuffleData = shuffle.data() as Shuffle
    const dates = shuffleData.dates
    const date = dates[dates.length - 1].toDate().toString()
    let reporterNames: string[] = []
    let status = new Promise(async resolve => {
      for (let idx = 0; idx < source.length; idx++) {
        let member = source[idx]
        const membersData = await db
          .collection("members")
          .doc(member)
          .get()
        const memberData = membersData.data() as MemberData
        if (memberData[date].timeStamp === undefined) {
          reporterNames.push(memberData[date].reporter)
        }
        if (idx === source.length - 1) {
          setTimeout(function() {
            resolve()
          }, 1000)
        }
      }
    })
    status.then(() => {
      bot.sendMessage(
        oslGroupId,
        `Those who have not submitted the report yet:\n${reporterNames.join(
          "\n"
        )}`
      )
    })
  }
}, 1000 * 60)

bot.on("message", async msg => {
  let message = msg.text
  var callback = responseCallbacks[msg.chat.id]
  if (callback) {
    delete responseCallbacks[msg.chat.id]
    return callback(msg)
  }
  if (message !== undefined) {
    let command = message.replace(/ .*/, "").toLowerCase()
    let text = message.replace(/(([\.\?\!]|^)\s*\b\w+)/gm, "$2").trim()
    if (command === "/start") {
      bot.sendMessage(
        msg.chat.id,
        `Hello there! My name is Zero Sama - I'm here to manage your Weekly Status Reports.
  Don't know what to do? Try hitting /help to know what I can do.`
      )
    } else if (command.startsWith("/help")) {
      bot.sendMessage(msg.chat.id, `/report - Submit your weekly report`)
    } else if (command === "name") {
      if (/\s/g.test(text)) {
        db.collection("telegram")
          .doc("members")
          .set(
            {
              [msg.chat.id]: {
                name: text
              }
            },
            { merge: true }
          )
      } else {
        bot.sendMessage(msg.chat.id, "Please enter your full name!")
      }
    } else if (command === "username") {
      if (/\s/g.test(text)) {
        bot.sendMessage(msg.chat.id, "Please enter a valid username!")
      } else {
        db.collection("telegram")
          .doc("members")
          .set(
            {
              [msg.chat.id]: {
                username: text
              }
            },
            { merge: true }
          )
        bot.sendMessage(msg.chat.id, "Successfully updated username!")
      }
    } else if (command === "usn") {
      db.collection("telegram")
        .doc("members")
        .set(
          {
            [msg.chat.id]: {
              usn: text.toUpperCase()
            }
          },
          { merge: true }
        )
      bot.sendMessage(msg.chat.id, "Successfully updated USN!")
    } else if (command === "/report") {
      bot.sendMessage(msg.chat.id, "Let's get started, shall we?")
    } else if (
      command === "message" &&
      msg.chat.id == Number(memberNameChatIdMap["Sanjith PK"])
    ) {
      await bot.sendMessage(
        memberNameChatIdMap["Sanjith PK"],
        "What message do you have?"
      )
      responseCallbacks[msg.chat.id] = async response => {
        var oslMessage = response.text as string
        bot.sendMessage(oslGroupId, oslMessage)
      }
    } else {
      bot.sendMessage(msg.chat.id, "I did not understand that!")
    }
  }
})

bot.onText(/\/report/, async msg => {
  if (msg.chat.id in chatId) {
    let memberName = chatId[msg.chat.id]
    const shuffle = await shuffleDocRef.get()
    const shuffleData = shuffle.data() as Shuffle
    const dates = shuffleData.dates
    const date = dates[dates.length - 1].toDate().toString()
    const source = shuffleData.members[memberName]
    const optKeyboard: telegramBot.SendMessageOptions = {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [[{ text: "Yes" }], [{ text: "No" }]]
      }
    }
    const optRemove: telegramBot.SendMessageOptions = {
      reply_markup: {
        remove_keyboard: true
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `Did ${source} visit OSL in the past week?`,
      optKeyboard
    )
    responseCallbacks[msg.chat.id] = async response => {
      var osl = response.text
      await bot.sendMessage(
        msg.chat.id,
        `What did ${source} do in the past week?`,
        optRemove
      )
      responseCallbacks[msg.chat.id] = async response => {
        var past = response.text
        await bot.sendMessage(
          msg.chat.id,
          `Sounds interesting! So what has ${source} planned for the coming week?`
        )
        responseCallbacks[msg.chat.id] = async response => {
          var future = response.text
          await bot.sendMessage(
            msg.chat.id,
            `Nice! Apart from that, what did ${source} do for fun?`
          )
          responseCallbacks[msg.chat.id] = response => {
            var fun = response.text
            db.collection("members")
              .doc(source)
              .set(
                {
                  [date]: {
                    osl,
                    past,
                    future,
                    fun,
                    reporter: memberName,
                    timeStamp: new Date()
                  }
                },
                { merge: true }
              )
            bot.sendMessage(
              msg.chat.id,
              `Alright then, your report has been updated successfully. Thank you and see you again next week! :)`
            )
          }
        }
      }
    }
  } else {
    bot.sendMessage(msg.chat.id, "You are not in the list yet, sorry :(")
  }
})

// Telegram Bot Code End

app.get("/", (_req, res) => {
  res.send("Zero Sama is Up")
})

app.get("/info", async (_req, res) => {
  const shuffle = await shuffleDocRef.get()
  const shuffleData = shuffle.data() as Shuffle
  res.json([shuffleData.members, shuffleData.timeStamp])
})

app.get("/reports", async (_req, res) => {
  let memberCollection = await db.collection("members").get()
  res.json(memberCollection.docs.map(doc => doc.data()))
})

app.get("/reports/:username", async (req, res) => {
  const { username } = req.params
  const member = await db
    .collection("members")
    .doc(usernames[username])
    .get()
  res.json(member.data())
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on port ${process.env.PORT}`)
})
