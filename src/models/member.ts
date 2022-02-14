import { firestore } from "firebase-admin"

export type Members = Record<string, string>

export interface MemberDetails {
  [key: string]: {
    telegramId: string
    username: string
    usn: string
    warningsLeft: number
  }
}

export interface Shuffle {
  dates: firestore.Timestamp[]
  members: Members
  timeStamp: Date
}

export interface WeekData {
  fun: string
  future: string
  osl: string
  past: string
  reporter: string
  timeStamp: firestore.Timestamp
}

export interface MemberData {
  [key: string]: WeekData
}
