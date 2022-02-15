import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { ResponseCallbacks } from "src/models/response-callbacks"
import { getAllChatIds } from "../services/members"

export const update = (
  bot: TelegramBot,
  db: firestore.Firestore,
  responseCallbacks: ResponseCallbacks
) => {
  bot.onText(/\/update/, async msg => {
    const chatIds = await getAllChatIds(db)
    if (msg.chat.id in chatIds) {
      const optKeyboard: TelegramBot.SendMessageOptions = {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "username" }], [{ text: "usn" }]],
        },
      }
      const optRemove: TelegramBot.SendMessageOptions = {
        reply_markup: {
          remove_keyboard: true,
        },
      }
      await bot.sendMessage(
        msg.chat.id,
        "What do you want to update? Name updation is not possible at the moment.",
        optKeyboard
      )
      responseCallbacks[msg.chat.id] = async response => {
        if (response.text == "username") {
          await bot.sendMessage(
            msg.chat.id,
            "Please enter your username",
            optRemove
          )
          responseCallbacks[msg.chat.id] = async response => {
            const username = response.text
            db.collection("details")
              .doc("members")
              .set(
                {
                  [chatIds[msg.chat.id]]: {
                    username,
                  },
                },
                { merge: true }
              )
            bot.sendMessage(msg.chat.id, "Success, updated username", optRemove)
          }
        } else {
          await bot.sendMessage(msg.chat.id, "Please enter your USN", optRemove)
          responseCallbacks[msg.chat.id] = async response => {
            const usn = response.text
            db.collection("details")
              .doc("members")
              .set(
                {
                  [chatIds[msg.chat.id]]: {
                    usn,
                  },
                },
                { merge: true }
              )
            bot.sendMessage(msg.chat.id, "Success, updated USN", optRemove)
          }
        }
      }
    } else {
      await bot.sendMessage(
        msg.chat.id,
        `You are not in the list, please use the /add command`
      )
    }
  })
}
