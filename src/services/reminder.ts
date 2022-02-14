import { firestore } from "firebase-admin"
import TelegramBot from "node-telegram-bot-api"
import { MemberData, MemberDetails, Shuffle } from "src/models/member"
import { OSL_GROUP_ID } from "src/utils/constants"
import { getActiveMembers, getMemberChatIdMap } from "./members"

export const reminder = (bot: TelegramBot, db: firestore.Firestore) => {
  const shuffleDocRef = db.collection("details").doc("assignment")
  const memberDocRef = db.collection("details").doc("members")

  // Sends a message to every member about there source of the week

  setInterval(async () => {
    let date = new Date()
    if (
      date.getDay() === 0 &&
      date.getHours() === 3 &&
      date.getMinutes() === 30
    ) {
      const shuffle = await shuffleDocRef.get()
      const shuffleData = shuffle.data() as Shuffle
      const memberMap = shuffleData.members
      const memberDetailDoc = await memberDocRef.get()
      const members = memberDetailDoc.data() as MemberDetails
      Object.keys(members).forEach(member => {
        const memberDetails = members[member]
        if (memberDetails.warningsLeft > 0) {
          bot.sendMessage(
            memberDetails.telegramId,
            `Hey there, hope you are doing well. Your source for the week is ${memberMap[member]}!
        Please use the /report command to send in your report.`
          )
        }
      })
    }
  }, 1000 * 60)

  // Sends a reminder to the members who haven't submitted there reports yet

  setInterval(async () => {
    let date = new Date()
    if (
      date.getDay() === 1 &&
      date.getHours() === 3 &&
      date.getMinutes() === 30
    ) {
      const shuffle = await shuffleDocRef.get()
      const shuffleData = shuffle.data() as Shuffle
      const dates = shuffleData.dates
      const date = dates[dates.length - 1].toDate().toString()
      const memberDetailDoc = await memberDocRef.get()
      const members = memberDetailDoc.data() as MemberDetails
      const memberChatIdMap = await getMemberChatIdMap(db)
      Object.keys(members).forEach(async member => {
        const memberDetails = members[member]
        let memberDoc = await db.collection("members").doc(member).get()
        let memberData = memberDoc.data() as MemberData
        if (
          memberDetails.warningsLeft > 0 &&
          memberData[date].timeStamp === undefined
        ) {
          let reporterName = memberData[date].reporter
          bot.sendMessage(
            memberChatIdMap[reporterName],
            `Hey there, This is a gentle reminder. Please submit your report soon using the /report command.`
          )
        }
      })
    }
  }, 1000 * 60)

  // Sends a list of members who haven't reported yet in the main group

  setInterval(async () => {
    let date = new Date()
    if (
      date.getDay() === 1 &&
      date.getHours() === 12 &&
      date.getMinutes() === 30
    ) {
      const shuffle = await shuffleDocRef.get()
      const shuffleData = shuffle.data() as Shuffle
      const dates = shuffleData.dates
      const date = dates[dates.length - 1].toDate().toString()
      let reporterNames: string[] = []
      const source = await getActiveMembers(db)
      let status = new Promise<void>(async resolve => {
        for (let idx = 0; idx < source.length; idx++) {
          let member = source[idx]
          const membersData = await db.collection("members").doc(member).get()
          const memberData = membersData.data() as MemberData
          if (memberData[date].timeStamp === undefined) {
            reporterNames.push(memberData[date].reporter)
          }
          if (idx === source.length - 1) {
            setTimeout(function () {
              resolve()
            }, 1000)
          }
        }
      })
      status.then(() => {
        bot.sendMessage(
          OSL_GROUP_ID,
          `Those who have not submitted the report yet:\n${reporterNames.join(
            "\n"
          )}`
        )
      })
    }
  }, 100 * 60)
}
