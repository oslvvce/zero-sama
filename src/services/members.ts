import { firestore } from "firebase-admin"
import { MemberDetails } from "src/models/member"

export const getActiveMembers = async (db: firestore.Firestore) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data() as MemberDetails
  const activeMembers = Object.keys(members).filter(
    member => members[member].warningsLeft > 0
  )
  return activeMembers
}

export const getChatIds = async (db: firestore.Firestore) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data() as MemberDetails
  let chatIds: { [key: string]: string } = {}
  Object.keys(members).forEach(member => {
    const memberDetails = members[member]
    if (memberDetails.warningsLeft > 0)
      chatIds[memberDetails.telegramId] = member
  })
  return chatIds
}

export const getMemberChatIdMap = async (db: firestore.Firestore) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data() as MemberDetails
  let chatIds: { [key: string]: string } = {}
  Object.keys(members).forEach(member => {
    const memberDetails = members[member]
    if (memberDetails.warningsLeft > 0)
      chatIds[member] = memberDetails.telegramId
  })
  return chatIds
}

export const getName = async (db: firestore.Firestore, username: string) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data() as MemberDetails
  let name = ""
  Object.keys(members).forEach(member => {
    const memberDetails = members[member]
    if (memberDetails.username === username) name = member
  })
  return name
}
