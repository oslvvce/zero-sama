import TelegramBot from "node-telegram-bot-api"

const DESCRIPTION = `
/report     - Submit your weekly report
/noshow  - Your source is not responding? File a noshow
/add         - Add yourself to the reporting system
/remove  - Remove yourself from the reporting system
/update   - Update your details
`

export const help = (bot: TelegramBot) => {
  bot.onText(/\/help/, async msg => {
    bot.sendMessage(msg.chat.id, DESCRIPTION)
  })
}
