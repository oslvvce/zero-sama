import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { ResponseCallbacks } from "src/models/response-callbacks"

export const add = (
  bot: TelegramBot,
  db: firestore.Firestore,
  responseCallbacks: ResponseCallbacks
) => {
  bot.onText(/\/add/, async msg => {
    await bot.sendMessage(msg.chat.id, `Please enter your full name`)
    responseCallbacks[msg.chat.id] = async response => {
      var fullname = response.text
      await bot.sendMessage(msg.chat.id, `Enter your desired username`)
      responseCallbacks[msg.chat.id] = async response => {
        var username = response.text
        await bot.sendMessage(msg.chat.id, `Enter your USN`)
        responseCallbacks[msg.chat.id] = response => {
          var usn = response.text
          db.collection("details")
            .doc("telegram")
            .set({
              [msg.chat.id]: {
                fullname,
                username,
                usn,
              },
            })
          bot.sendMessage(msg.chat.id, "Successfully added user!")
        }
      }
    }
  })
}
