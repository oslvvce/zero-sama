import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { getChatIds } from "../services/members"

export const remove = (bot: TelegramBot, db: firestore.Firestore) => {
  bot.onText(/\/remove/, async msg => {
    const chatIds = await getChatIds(db)
    if (msg.chat.id in chatIds) {
      db.collection("details")
        .doc("members")
        .set(
          {
            [chatIds[msg.chat.id]]: {
              warningsLeft: 0,
            },
          },
          { merge: true }
        )
      bot.sendMessage(
        msg.chat.id,
        "Successfully removed from the reporting system!"
      )
    } else {
      bot.sendMessage(msg.chat.id, "Already removed!")
    }
  })
}
