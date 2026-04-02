const fs = require("fs");
const vm = require("vm");

const filePath = "questions.js";
const source = fs.readFileSync(filePath, "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${source}\nthis.__examDuration = examDuration; this.__questions = questions;`, sandbox);

const examDuration = sandbox.__examDuration;
const questions = sandbox.__questions;

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function classifyTopic(text) {
  const lower = text.toLowerCase();

  if (/(genesis|created|creation|adam|eve|garden of eden|eden|fall of man|tower of babel|noah)/.test(lower)) {
    return "creation";
  }
  if (/(abraham|isaac|jacob|joseph|covenant|circumcision|patriarch)/.test(lower)) {
    return "patriarch";
  }
  if (/(moses|egypt|passover|sinai|ten commandments|pharaoh|red sea|israelites)/.test(lower)) {
    return "exodus";
  }
  if (/(david|solomon|samuel|saul|elijah|elisha|psalms|proverbs|temple|ahab|jezebel|prophet)/.test(lower)) {
    return "kings";
  }
  if (/(jesus|mary|joseph|bethlehem|nazareth|john the baptist|disciples|parable|miracle|beatitudes|lord's prayer|resurrection|ascension|holy spirit)/.test(lower)) {
    return "gospel";
  }
  if (/(paul|peter|pentecost|acts|church|timothy|romans|corinthians|galatians|epistle|missionary)/.test(lower)) {
    return "church";
  }

  return "general";
}

function classifyAnswerType(questionText, answer) {
  const lower = questionText.toLowerCase();

  if (/(who|mother|father|son|daughter|wife|husband|king|prophet|disciple|apostle|priest|judge)/.test(lower)) {
    return "person";
  }
  if (/(where|born in|mount|city|land|garden|river|temple in|located|place|country)/.test(lower)) {
    return "place";
  }
  if (/(book|gospel|epistle|letter|psalms|proverbs)/.test(lower)) {
    return "book";
  }
  if (/(how many|days|years|times|forty|twelve|seven|first|last)/.test(lower) || /^\d+$/.test(answer)) {
    return "number";
  }
  if (/(covenant|commandment|fruit of the spirit|beatitude|miracle|parable|meaning|sign|symbol)/.test(lower)) {
    return "concept";
  }

  return "fact";
}

function introByTopic(topic, answer) {
  switch (topic) {
    case "creation":
      return `"${answer}" is correct because it matches the detail given in the early Bible accounts, especially in Genesis where creation, the fall, and humanity's earliest history are recorded.`;
    case "patriarch":
      return `"${answer}" is correct because it fits the story of the patriarchs, the family line through which God revealed His covenant promises to Abraham, Isaac, Jacob, and their descendants.`;
    case "exodus":
      return `"${answer}" is correct because it agrees with the story of Israel's deliverance, law, and covenant life under the leadership of Moses.`;
    case "kings":
      return `"${answer}" is correct because it matches the historical books and prophetic records that describe Israel's kings, prophets, worship, and national life.`;
    case "gospel":
      return `"${answer}" is correct because it agrees with the Gospel account of the life, teachings, miracles, death, and resurrection of Jesus Christ.`;
    case "church":
      return `"${answer}" is correct because it fits the teaching and history of the early Church, especially in Acts and the New Testament letters.`;
    default:
      return `"${answer}" is correct because it best matches the Biblical fact or teaching being tested in this question.`;
  }
}

function lessonByTopic(topic) {
  switch (topic) {
    case "creation":
      return "Questions in this area are easier when you connect names, places, and events to the message of Genesis, rather than trying to memorize isolated facts.";
    case "patriarch":
      return "The key lesson here is that God worked through real people and family history, so it helps to remember each person together with the promise, test, or covenant linked to that person.";
    case "exodus":
      return "In this topic, students should connect each event with God's rescue of His people, His commandments, and the way He formed Israel into a covenant nation.";
    case "kings":
      return "This part of CRS becomes clearer when you remember who did what, why the event mattered spiritually, and what lesson it teaches about obedience, worship, and leadership.";
    case "gospel":
      return "The best way to understand Gospel questions is to connect each person, place, or event to the mission of Jesus and the spiritual lesson behind it.";
    case "church":
      return "This topic is easier when you link each letter, event, or apostle to the growth of the early Church and the message preached to believers.";
    default:
      return "A good way to prepare is to connect each answer to the wider Bible story, so the fact makes sense within its spiritual and historical setting.";
  }
}

function depthByTopic(topic) {
  switch (topic) {
    case "creation":
      return "Genesis does more than give names and places; it explains humanity's origin, God's purpose for creation, the entrance of sin, and the beginning of God's plan of redemption.";
    case "patriarch":
      return "The patriarch stories teach faith, obedience, covenant, and God's faithfulness across generations, so each person or event should be understood as part of that larger promise.";
    case "exodus":
      return "The Exodus story is central in CRS because it shows God as Deliverer, Lawgiver, and Covenant Keeper, forming a people who are meant to live in holiness and trust.";
    case "kings":
      return "The stories of kings and prophets show that leadership in Israel was not only political; it was also spiritual, and success depended on obedience to God.";
    case "gospel":
      return "In the Gospels, every place, person, miracle, and teaching helps reveal who Jesus is and why His mission matters for salvation, faith, and daily living.";
    case "church":
      return "The early Church topic teaches how the message of Jesus spread through the apostles, the work of the Holy Spirit, and the instruction given to believers in the New Testament letters.";
    default:
      return "When you study CRS well, you do not only memorize the answer; you also understand the spiritual lesson, historical setting, and meaning of the event or teaching.";
  }
}

function answerTypeLesson(type, answer) {
  switch (type) {
    case "person":
      return `That is why the correct answer is the person "${answer}", the one directly connected with the event, teaching, or role mentioned in the question. In CRS, remembering a person also means remembering that person's place in God's plan and the lesson attached to that life.`;
    case "place":
      return `That is why "${answer}" is the correct place, because it is the location specifically linked with the event in Scripture. Bible places are important because they often help students connect events to real history and to the message of the passage.`;
    case "book":
      return `That is why "${answer}" is correct, because it is the book of the Bible associated with the account or teaching being asked about. Knowing the right book also helps students understand where a teaching fits within the whole Bible story.`;
    case "number":
      return `That is why "${answer}" is correct, because this number, order, or time detail is the one actually stated in the Biblical record. In many Bible passages, numbers and time periods are meaningful and should be remembered accurately.`;
    case "concept":
      return `That is why "${answer}" is correct, because it expresses the exact idea, command, virtue, or teaching the question is asking for. CRS understanding becomes deeper when students know not only the term itself, but also what it teaches about God, people, and right living.`;
    default:
      return `That is why "${answer}" is the correct answer to this question. The answer fits both the wording of the question and the Biblical context behind it.`;
  }
}

function wrongReason(option, type, topic) {
  switch (type) {
    case "person":
      return `"${option}" is not correct because it refers to a different Bible person, and that person is not the one directly connected to this event or role.`;
    case "place":
      return `"${option}" is not correct because it is a different Bible place, not the location specifically linked with this event.`;
    case "book":
      return `"${option}" is not correct because it is a different book of the Bible and does not provide the exact account or teaching asked for here.`;
    case "number":
      return `"${option}" is not correct because that number or order does not match the exact detail given in Scripture for this event.`;
    case "concept":
      return `"${option}" is not correct because it represents a different Biblical teaching, quality, or idea from the one being tested.`;
    default:
      if (topic === "gospel") {
        return `"${option}" is not correct because it does not fit the specific Gospel event or teaching referred to in the question.`;
      }
      if (topic === "church") {
        return `"${option}" is not correct because it does not match the exact teaching or early Church fact asked in the question.`;
      }
      return `"${option}" is not correct because it does not match the exact Biblical fact required by the question.`;
  }
}

function buildExplanation(question) {
  const questionText = normalize(question.questionText || question.text);
  const answer = normalize(question.correctAnswer || question.answer);
  const topic = classifyTopic(questionText);
  const answerType = classifyAnswerType(questionText, answer);
  const wrongOptions = (question.options || []).filter(option => normalize(option) !== answer);

  const lines = [
    `Why "${answer}" is correct:`,
    `- ${introByTopic(topic, answer)}`,
    `- ${lessonByTopic(topic)}`,
    `- ${depthByTopic(topic)}`,
    `- ${answerTypeLesson(answerType, answer)}`
  ];

  if (wrongOptions.length > 0) {
    lines.push(`Why the other options are not correct:`);
    for (const option of wrongOptions) {
      lines.push(`- ${wrongReason(option, answerType, topic)}`);
    }
  }

  return lines.join("\n");
}

questions.CRS = questions.CRS.map(question => ({
  ...question,
  explanation: buildExplanation(question)
}));

const output = [
  `const examDuration = ${examDuration}; // in minutes`,
  "",
  `const QUESTIONS_BY_SUBJECT = ${JSON.stringify(questions, null, 2)};`,
  "",
  "const questions = QUESTIONS_BY_SUBJECT;",
  ""
].join("\n");

fs.writeFileSync(filePath, output, "utf8");
