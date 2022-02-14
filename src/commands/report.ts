import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { Shuffle } from "src/models/member"
import { ResponseCallbacks } from "src/models/response-callbacks"
import { getChatIds } from "../services/members"

export const report = (
  bot: TelegramBot,
  db: firestore.Firestore,
  responseCallbacks: ResponseCallbacks
) => {
  bot.onText(/\/report/, async msg => {
    const chatIds = await getChatIds(db)
    let memberName = chatIds[msg.chat.id]
    if (msg.chat.id.toString() in chatIds) {
      const shuffle = await db.collection("details").doc("assignment").get()
      const shuffleData = shuffle.data() as Shuffle
      const dates = shuffleData.dates
      const date = dates[dates.length - 1].toDate().toString()
      const source = shuffleData.members[memberName]
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
                      timeStamp: new Date(),
                    },
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
}
