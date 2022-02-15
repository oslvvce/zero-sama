import { firestore } from "firebase-admin"
import telegramBot from "node-telegram-bot-api"
import { ResponseCallbacks } from "src/models/response-callbacks"
import { reminder } from "../services/reminder"
import { ADMIN_IDs, OSL_GROUP_ID } from "../utils/constants"
import { add } from "./add"
import { help } from "./help"
import { noShow } from "./noshow"
import { remove } from "./remove"
import { report } from "./report"
import { update } from "./update"

const token = process.env.token as string

var responseCallbacks: ResponseCallbacks = {}

const bot = new telegramBot(token, {
  polling: true,
})

bot.on("message", async msg => {
  var callback = responseCallbacks[msg.chat.id]
  if (callback) {
    delete responseCallbacks[msg.chat.id]
    return callback(msg)
  }
  let message = msg.text as string
  let command = message.replace(/ .*/, "").toLowerCase()
  if (command === "/start") {
    bot.sendMessage(
      msg.chat.id,
      `Hello there! My name is Zero Sama - I'm here to manage your Weekly Status Reports.
Don't know what to do? Try hitting /help to know what I can do.`
    )
  } else if (command === "message" && ADMIN_IDs.includes(msg.chat.id)) {
    await bot.sendMessage(msg.chat.id, "What message do you have?")
    responseCallbacks[msg.chat.id] = async response => {
      var oslMessage = response.text as string
      bot.sendMessage(OSL_GROUP_ID, oslMessage)
    }
  }
})

export const botCommands = (db: firestore.Firestore) => {
  help(bot)
  add(bot, db, responseCallbacks)
  update(bot, db, responseCallbacks)
  remove(bot, db)
  report(bot, db, responseCallbacks)
  noShow(bot, db)
  reminder(bot, db)
}
