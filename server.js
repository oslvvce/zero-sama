const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const telegramBot = require("node-telegram-bot-api");
const {token} = require("./config.json");
const {
  membersList,
  usernames,
  chatId,
  memberNameChatIdMap,
} = require("./data.json");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const firebase = require("firebase");
var firebaseConfig = require("./firebaseConfig.json");
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const admin = require("firebase-admin");
let serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
let db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Used like so
var reporter = [...membersList];
var source = [...membersList];

let docRef = db.collection("members").doc("0");

var shuffleFunc = () => {
  shuffle(reporter);
  let reportSourceMap = {};
  var count = 0;
  while (count < 2 * source.length) {
    for (let i = 0; i < source.length; i++) {
      if (source[i] === reporter[i]) {
        count = 0;
        i = 0;
        shuffle(reporter);
      } else {
        count += 1;
      }
    }
  }
  for (let i = 0; i < source.length; i++) {
    reportSourceMap[source[i]] = reporter[i];
  }
  Object.keys(reportSourceMap).forEach((member) => {
    if (
      reportSourceMap[member] ===
      reportSourceMap[reportSourceMap[reportSourceMap[member]]]
    ) {
      shuffleFunc();
    }
  });
};

// Shuffles the members list on every Saturday

setInterval(() => {
  let date = new Date();
  if (date.getDay() === 6 && date.getHours() === 1 && date.getMinutes() === 0) {
    date.setDate(date.getDate() + 1);
    shuffleFunc();
    let sourceReporterMap = {};
    for (let i = 0; i < reporter.length; i++)
      sourceReporterMap[source[i]] = reporter[i];
    docRef.update({
      members: sourceReporterMap,
      timeStamp: new Date(),
      dates: FieldValue.arrayUnion(date),
    });
    for (let i = 0; i < reporter.length; i++) {
      db.collection("members")
        .doc(reporter[i])
        .set(
          {
            [date.toString()]: {
              reporter: source[i],
            },
          },
          {merge: true}
        );
    }
  }
}, 1000 * 60);

// Telegram Bot Code Start

const oslGroupId = -1001405263968;

const bot = new telegramBot(token, {
  polling: true,
});

var answerCallbacks = {};

// Sends a message to every member about there source of the week

setInterval(() => {
  let date = new Date();
  if (
    date.getDay() === 0 &&
    date.getHours() === 3 &&
    date.getMinutes() === 30
  ) {
    db.collection("members")
      .doc("0")
      .get()
      .then((members) => {
        let memberMap = members.data()["members"];
        reporter.forEach((member) => {
          bot.sendMessage(
            memberNameChatIdMap[member],
            `Hey there, hope you are doing well! Your source for the week is ${memberMap[member]}!
Please use the /report command to send your report.`
          );
        });
      });
  }
}, 1000 * 60);

// Sends a reminder to the members who haven't submitted there reports yet

setInterval(() => {
  let date = new Date();
  if (
    date.getDay() === 1 &&
    date.getHours() === 3 &&
    date.getMinutes() === 30
  ) {
    docRef.get().then((doc) => {
      if (doc.exists) {
        let dates = doc.data()["dates"];
        let date = dates[dates.length - 1].toDate();
        source.forEach((member) => {
          db.collection("members")
            .doc(member)
            .get()
            .then((doc) => {
              if (doc.data()[date]["timeStamp"] === undefined) {
                let reporterName = doc.data()[date]["reporter"];
                bot.sendMessage(
                  memberNameChatIdMap[reporterName],
                  `Hey there, This is a gentle reminder. Please submit your report soon using the /report command.`
                );
              }
            });
        });
      }
    });
  }
}, 1000 * 60);

// Sends a list of members who haven't reported yet in the main group

setInterval(() => {
  let date = new Date();
  if (
    date.getDay() === 1 &&
    date.getHours() === 12 &&
    date.getMinutes() === 30
  ) {
    docRef.get().then((doc) => {
      if (doc.exists) {
        let dates = doc.data()["dates"];
        let date = dates[dates.length - 1].toDate();
        var reporterNames = [];
        var status = new Promise((resolve) => {
          for (let idx = 0; idx < source.length; idx++) {
            let member = source[idx];
            db.collection("members")
              .doc(member)
              .get()
              .then((doc) => {
                if (doc.data()[date]["timeStamp"] === undefined) {
                  reporterNames.push(doc.data()[date]["reporter"]);
                }
                if (idx === source.length - 1)
                  setTimeout(function() {
                    resolve();
                  }, 1000);
              });
          }
        });
        status.then(() => {
          bot.sendMessage(
            oslGroupId,
            `Those who have not submitted the report yet:\n${reporterNames.join(
              "\n"
            )}`
          );
        });
      }
    });
  }
}, 1000 * 60);

bot.on("message", (msg) => {
  let message = msg.text;
  let command = message.replace(/ .*/, "").toLowerCase();
  let text = message.replace(/(([\.\?\!]|^)\s*\b\w+)/gm, "$2").trim();
  var callback = answerCallbacks[msg.chat.id];
  if (callback) {
    delete answerCallbacks[msg.chat.id];
    return callback(msg);
  }
  if (command === "/start") {
    bot.sendMessage(
      msg.chat.id,
      `Hello there! My name is Zero Sama - I'm here to manage your Weekly Status Reports.
  Don't know what to do? Try hitting /help to know what I can do.`
    );
  } else if (command.startsWith("/help")) {
    bot.sendMessage(msg.chat.id, `/report - Submit your weekly report`);
  } else if (command === "name") {
    if (/\s/g.test(text)) {
      db.collection("telegram")
        .doc("members")
        .set(
          {
            [msg.chat.id]: {
              name: text,
            },
          },
          {merge: true}
        );
    } else {
      bot.sendMessage(msg.chat.id, "Please enter your full name!");
    }
  } else if (command === "username") {
    if (/\s/g.test(text)) {
      bot.sendMessage(msg.chat.id, "Please enter a valid username!");
    } else {
      db.collection("telegram")
        .doc("members")
        .set(
          {
            [msg.chat.id]: {
              username: text,
            },
          },
          {merge: true}
        );
      bot.sendMessage(msg.chat.id, "Successfully updated username!");
    }
  } else if (command === "usn") {
    db.collection("telegram")
      .doc("members")
      .set(
        {
          [msg.chat.id]: {
            usn: text.toUpperCase(),
          },
        },
        {merge: true}
      );
    bot.sendMessage(msg.chat.id, "Successfully updated USN!");
  } else if (command === "/report") {
    bot.sendMessage(msg.chat.id, "Let's get started, shall we?");
  } else if (
    command === "message" &&
    msg.chat.id == memberNameChatIdMap["Sanjith PK"]
  ) {
    bot
      .sendMessage(
        memberNameChatIdMap["Sanjith PK"],
        "What message do you have?"
      )
      .then(() => {
        answerCallbacks[msg.chat.id] = (answer) => {
          var osl = answer.text;
          bot.sendMessage(oslGroupId, osl);
        };
      });
  } else {
    bot.sendMessage(msg.chat.id, "I did not understand that!");
  }
});

bot.onText(/\/report/, function(msg) {
  if (msg.chat.id in chatId) {
    let memberName = chatId[msg.chat.id];
    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          let dates = doc.data()["dates"];
          let date = dates[dates.length - 1].toDate();
          let source = doc.data()["members"][memberName];
          const optKeyboard = {
            parse_mode: "Markdown",
            reply_markup: {
              keyboard: [[{text: "Yes"}], [{text: "No"}]],
            },
          };
          const optRemove = {
            reply_markup: {
              remove_keyboard: true,
            },
          };
          bot
            .sendMessage(
              msg.chat.id,
              `Did ${source} visit OSL in the past week?`,
              optKeyboard
            )
            .then(() => {
              answerCallbacks[msg.chat.id] = (answer) => {
                var osl = answer.text;
                bot
                  .sendMessage(
                    msg.chat.id,
                    `What did ${source} do in the past week?`,
                    optRemove
                  )
                  .then(() => {
                    answerCallbacks[msg.chat.id] = (answer) => {
                      var past = answer.text;
                      bot
                        .sendMessage(
                          msg.chat.id,
                          `Sounds interesting! So what has ${source} planned for the coming week?`
                        )
                        .then(() => {
                          answerCallbacks[msg.chat.id] = (answer) => {
                            var future = answer.text;
                            bot
                              .sendMessage(
                                msg.chat.id,
                                `Nice! Apart from that, what did ${source} do for fun?`
                              )
                              .then(() => {
                                answerCallbacks[msg.chat.id] = (answer) => {
                                  var fun = answer.text;
                                  db.collection("members")
                                    .doc(source)
                                    .set(
                                      {
                                        [date]: {
                                          osl: osl,
                                          past: past,
                                          future: future,
                                          fun: fun,
                                          reporter: memberName,
                                          timeStamp: new Date(),
                                        },
                                      },
                                      {merge: true}
                                    );
                                  bot.sendMessage(
                                    msg.chat.id,
                                    `Alrighty, then! Your report has been updated successfully. Thank you and see you again next week! :)`
                                  );
                                };
                              });
                          };
                        });
                    };
                  });
              };
            });
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      })
      .catch(function(error) {
        console.log("Error getting document:", error);
      });
  } else {
    bot.sendMessage(msg.chat.id, "You are not in the list yet, sorry :(");
  }
});

// Telegram Bot Code End

app.get("/info", (req, res) => {
  docRef
    .get()
    .then(function(doc) {
      if (doc.exists) {
        res.json([doc.data().members, doc.data().timeStamp]);
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
    })
    .catch(function(error) {
      console.log("Error getting document:", error);
    });
});

app.get("/reports", (req, res) => {
  db.collection("members")
    .get()
    .then((members) => res.json(members.docs.map((doc) => doc.data())));
});

app.get("/reports/:username", (req, res) => {
  const {username} = req.params;
  db.collection("members")
    .doc(usernames[username])
    .get()
    .then((memberDoc) => {
      res.json(memberDoc.data());
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is running on port ${process.env.PORT}`);
});
