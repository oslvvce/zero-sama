import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { ResponseCallbacks } from "src/models/response-callbacks"
import { getAllChatIds } from "../services/members"

export const add = (
  bot: TelegramBot,
  db: firestore.Firestore,
  responseCallbacks: ResponseCallbacks
) => {
  bot.onText(/\/add/, async msg => {
    const chatIds = await getAllChatIds(db)
    if (msg.chat.id in chatIds) {
      const optKeyboard: TelegramBot.SendMessageOptions = {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
        },
      }
      const optRemove: TelegramBot.SendMessageOptions = {
        reply_markup: {
          remove_keyboard: true,
        },
      }
      await bot.sendMessage(
        msg.chat.id,
        "Want to rejoin the system?",
        optKeyboard
      )
      responseCallbacks[msg.chat.id] = async response => {
        if (response.text == "Yes") {
          db.collection("details")
            .doc("members")
            .set(
              {
                [chatIds[msg.chat.id]]: {
                  warningsLeft: 3,
                },
              },
              { merge: true }
            )
          bot.sendMessage(
            msg.chat.id,
            "Success, added you back to the system",
            optRemove
          )
        } else {
          bot.sendMessage(
            msg.chat.id,
            "No problem, join when you are ready to commit",
            optRemove
          )
        }
      }
    } else {
      await bot.sendMessage(msg.chat.id, `Please enter your full name`)
      responseCallbacks[msg.chat.id] = async response => {
        var fullname = response.text as string
        if (/\s/g.test(fullname)) {
          await bot.sendMessage(msg.chat.id, `Enter your desired username`)
          responseCallbacks[msg.chat.id] = async response => {
            var username = response.text
            await bot.sendMessage(msg.chat.id, `Enter your USN`)
            responseCallbacks[msg.chat.id] = response => {
              var usn = response.text
              db.collection("details")
                .doc("members")
                .set(
                  {
                    [fullname]: {
                      telegramId: msg.chat.id,
                      username,
                      usn,
                      warningsLeft: 3,
                    },
                  },
                  { merge: true }
                )
              bot.sendMessage(msg.chat.id, "Successfully added user!")
            }
          }
        } else {
          bot.sendMessage(
            msg.chat.id,
            "Please enter your full name and try /add again!"
          )
        }
      }
    }
  })
}
