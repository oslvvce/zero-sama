import TelegramBot from "node-telegram-bot-api"

const DESCRIPTION = `/report - Submit your weekly report
/add - Add yourself to the reporting system
/remove - Remove yourself from the reporting system`

export const help = (bot: TelegramBot) => {
  bot.onText(/\/help/, async msg => {
    bot.sendMessage(msg.chat.id, DESCRIPTION)
  })
}
