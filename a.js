const a = {
  284739304: {
    name: "Srikeerthi S",
    username: "srikeerthi_s",
    usn: "4VV17CS096",
  },
  329865594: { username: "sanjithpk", usn: "4VV17CS082", name: "Sanjith PK" },
  383163659: { username: "sureshn", usn: "4VV17CS102", name: "Suresh N" },
  397236974: { name: "Pramod K", username: "pramod7", usn: "4VV18CS060" },
  481650594: {
    username: "shreevari",
    name: "Shreevari SP",
    usn: "4VV16CS100",
  },
  535331060: { username: "sourabha", usn: "4VV18CS140", name: "Sourabha G" },
  635578454: {
    name: "Nagasandesh N",
    username: "sandesh09",
    usn: "4VV18CS084",
  },
  644774177: {
    name: "Samantha Paul",
    username: "paulease",
    usn: "4VV17CS081",
  },
  661923747: {
    usn: "4VV19CS010",
    username: "clintondsza",
    name: "Aneesh Clinton D'Souza",
  },
  669432927: { username: "umesh_ar", usn: "4VV17CS107", name: "Umesh A" },
  680078107: { name: "Soujanya N", username: "soujanya", usn: "4VV18CS138" },
  680933112: { username: "zshzero", usn: "4VV16CS014", name: "Ashwin Kumar" },
  691411681: { name: "Kunal S", usn: "4VV19CS073", username: "kunal_s" },
  726673660: {
    name: "Derryl Kevin Monis",
    username: "derrylkevin",
    usn: "4VV18CS034",
  },
  763606568: {
    name: "Gaurav Purswani",
    usn: "4VV18CS044",
    username: "pingport80",
  },
  774846988: { usn: "4VV19CS102", username: "neha_balaji", name: "Neha B" },
  804362799: {
    usn: "4VV17CS114",
    username: "vibhaprasad",
    name: "Vibha Prasad",
  },
  806981820: {
    username: "chandan_b_gowda",
    name: "Chandan B Gowda",
    usn: "4VV19CS029",
  },
  921285143: {
    usn: "4VV18CS077",
    username: "meghasubramanya1104",
    name: "Megha Subramanya",
  },
  954776791: { usn: "4VV19EE407", username: "nith", name: "Nithin Jaikar" },
  958539808: {
    usn: "4VV19CS165",
    username: "swathi_kr",
    name: "Swathi Meghana K R",
  },
  958627410: {
    usn: "4VV19ME140",
    username: "thusharkn",
    name: "Thushar K Nimbalkar",
  },
  965842635: {
    username: "dr_clueless",
    usn: "4VV19CS019",
    name: "Avinash Arun",
  },
  1002715513: { username: "manju_m", usn: "4VV18CS075", name: "Manju M" },
  1010613146: { usn: "4VV18CS093", name: "Nimesh M", username: "nimeshm" },
  1016867363: {
    usn: "4VV18CS101",
    username: "chanchalvp",
    name: "Patil Chanchal Vinod",
  },
  1096098708: {
    username: "kratee",
    name: "Kratee Pareek",
    usn: "4VV18IS044",
  },
  1282171659: {
    name: "Vaibhav D S",
    usn: "4VV18CS165",
    username: "vaibhavds",
  },
  1305193161: { name: "Nidhi R", username: "@NidhiR", usn: "4VV18CS091" },
}

b = {}
Object.keys(a).forEach(k => {
  b[a[k].name] = {
    telegramId: k,
    username: a[k].username,
    usn: a[k].usn,
    warningsLeft: 0,
  }
})

console.log(b)
