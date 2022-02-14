import { firestore } from "firebase-admin"
import { Members } from "src/models/member"
import { getActiveMembers } from "./members"

function shuffle(array: string[]) {
  let currentIndex = array.length,
    temporaryValue: string,
    randomIndex: number

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

const shuffleMembers = (source: string[], reporter: string[]) => {
  shuffle(reporter)
  let reportSourceMap: Members = {}
  let count = 0
  while (count < 2 * source.length) {
    for (let i = 0; i < source.length; i++) {
      if (source[i] === reporter[i]) {
        count = 0
        i = 0
        shuffle(reporter)
      } else {
        count += 1
      }
    }
  }
  for (let i = 0; i < source.length; i++)
    reportSourceMap[source[i]] = reporter[i]
  Object.keys(reportSourceMap).forEach(member => {
    if (
      reportSourceMap[member] ===
      reportSourceMap[reportSourceMap[reportSourceMap[member]]]
    ) {
      shuffleMembers(source, reporter)
    }
  })
}

// Shuffles the members list on every Saturday

export const shuffleJob = (db: firestore.Firestore) => {
  const shuffleDocRef = db.collection("details").doc("assignment")
  const FieldValue = firestore.FieldValue

  setInterval(async () => {
    let date = new Date()
    if (
      date.getDay() === 6 &&
      date.getHours() === 13 &&
      date.getMinutes() === 0
    ) {
      date.setDate(date.getDate() + 1)
      const activeMembers = await getActiveMembers(db)
      var reporter = [...activeMembers]
      var source = [...activeMembers]
      shuffleMembers(source, reporter)
      let sourceReporterMap: Members = {}
      for (let i = 0; i < reporter.length; i++)
        sourceReporterMap[source[i]] = reporter[i]
      shuffleDocRef.update({
        members: sourceReporterMap,
        timeStamp: new Date(),
        dates: FieldValue.arrayUnion(date),
      })
      for (let i = 0; i < reporter.length; i++) {
        db.collection("members")
          .doc(reporter[i])
          .set(
            {
              [date.toString()]: {
                reporter: source[i],
              },
            },
            { merge: true }
          )
      }
    }
  }, 1000 * 60)
}
