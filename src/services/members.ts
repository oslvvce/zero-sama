import { firestore } from "firebase-admin"
import { MemberDetails, Shuffle } from "src/models/member"

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

export const getAllChatIds = async (db: firestore.Firestore) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data() as MemberDetails
  let chatIds: { [key: string]: string } = {}
  Object.keys(members).forEach(member => {
    const memberDetails = members[member]
    chatIds[memberDetails.telegramId] = member
  })
  return chatIds
}

export const getMemberChatIdMap = async (db: firestore.Firestore) => {
  const memberDoc = await db.collection("details").doc("members").get()
  const members = memberDoc.data() as MemberDetails
  let memberChatIdMap: { [key: string]: string } = {}
  Object.keys(members).forEach(member => {
    const memberDetails = members[member]
    if (memberDetails.warningsLeft > 0)
      memberChatIdMap[member] = memberDetails.telegramId
  })
  return memberChatIdMap
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

export const getSource = async (db: firestore.Firestore, name: string) => {
  const shuffleDoc = await db.collection("details").doc("assignment").get()
  const assignment = shuffleDoc.data() as Shuffle
  return assignment.members[name]
}
