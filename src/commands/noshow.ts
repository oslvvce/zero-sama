import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { getChatIds, getSource } from "../services/members"

export const noShow = (bot: TelegramBot, db: firestore.Firestore) => {
  bot.onText(/\/noshow/, async msg => {
    const chatIds = await getChatIds(db)
    const source = await getSource(db, chatIds[msg.chat.id])
    bot.sendMessage(msg.chat.id, `Note taken, ${source} a no show`)
    db.collection("details")
      .doc("noshow")
      .set(
        {
          [source]: true,
        },
        { merge: true }
      )
  })
}
