import TelegramBot from "node-telegram-bot-api"

export interface ResponseCallbacks {
  [key: number]: (answer: TelegramBot.Message) => void
}
