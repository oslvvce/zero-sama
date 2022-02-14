import TelegramBot from "node-telegram-bot-api"

export const report = (bot: TelegramBot) => {
  bot.onText(/\/report/, async msg => {
    console.log(msg)
  })
}
