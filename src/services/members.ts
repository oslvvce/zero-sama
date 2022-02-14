import { firestore } from "firebase-admin"
import { MemberStatus } from "src/models/member"

export const getActiveMembers = async (db: firestore.Firestore) => {
  const memberDoc = await db.collection("details").doc("status").get()
  const members = memberDoc.data() as MemberStatus
  const activeMembers = Object.keys(members).filter(
    member => members[member] !== 0
  )
  return activeMembers
}
