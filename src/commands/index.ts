import telegramBot from "node-telegram-bot-api"
import { help } from "./help"

const token = process.env.token as string

const oslGroupId = -1001405263968

const bot = new telegramBot(token, {
  polling: true,
})

bot.on("message", async msg => {
  let message = msg.text
  console.log(message, oslGroupId)
})

export const botCommands = () => {
  help(bot)
}
