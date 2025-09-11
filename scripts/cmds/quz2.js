const axios = require('axios');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'quiz2',
    version: '1.1',
    author: 'Farhan',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'Hard-level trivia quiz game (English)',
    category: 'game',
    guide: {
      en: '{pn}quiz2'
    }
  },

  onStart: async ({ api, event }) => {
    const { threadID, senderID } = event;

    try {
      const res = await axios.get('https://sus-apis-2.onrender.com/api/quiz?amount=1&difficulty=hard&type=multiple');
      const questionData = res.data?.data?.questions?.[0];

      if (!res.data.success || !questionData) {
        return api.sendMessage('❌ Could not load quiz. Try again later.', threadID);
      }


      const options = [...questionData.incorrectAnswers, questionData.correctAnswer];
    
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      const correctIndex = options.indexOf(questionData.correctAnswer);

      const cleanCategory = questionData.category.replace(/&amp;/g, '&');
      const question = questionData.question;

      const optionText = `a) ${options[0]}\nb) ${options[1]}\nc) ${options[2]}\nd) ${options[3]}`;

      const quizMsg = `🧠 Hard Quiz: [${cleanCategory}]\n\n❓ ${question}\n\n${optionText}\n\nReply with a, b, c, or d to answer.`;

      const sentMsg = await api.sendMessage(quizMsg, threadID);

      global.client.handleReply.push({
        name: 'quiz2',
        messageID: sentMsg.messageID,
        threadID,
        senderID,
        correctIndex,
        options,
        timeout: setTimeout(async () => {
          const idx = global.client.handleReply.findIndex(e => e.messageID === sentMsg.messageID && e.name === 'quiz2');
          if (idx >= 0) global.client.handleReply.splice(idx, 1);
          await api.sendMessage('⏰ Time is up! You didn’t answer.', threadID);
        }, 60000)
      });

      log('info', `Hard quiz sent to ${senderID} in thread ${threadID}`);
    } catch (error) {
      log('error', `Quiz fetch error: ${error.message}`);
      api.sendMessage('❌ Failed to fetch quiz. Try again later.', threadID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const reply = event.body.trim().toLowerCase();
    const { threadID, senderID, messageID } = event;

    if (!event.messageReply || event.messageReply.messageID !== handleReply.messageID) {
      return api.sendMessage('⚠️ This is not a reply to the quiz.', threadID, messageID);
    }

    if (!['a', 'b', 'c', 'd'].includes(reply)) {
      return api.sendMessage('⚠️ Please reply with only "a", "b", "c", or "d".', threadID, messageID);
    }

    const idx = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID && e.name === 'quiz2');
    if (idx >= 0) {
      clearTimeout(global.client.handleReply[idx].timeout);
      global.client.handleReply.splice(idx, 1);
    }

    const userIndex = { a: 0, b: 1, c: 2, d: 3 }[reply];
    const correctAnswer = handleReply.options[handleReply.correctIndex];

    if (userIndex === handleReply.correctIndex) {
      await api.sendMessage('✅ Correct! Well done.', threadID, messageID);
    } else {
      await api.sendMessage(`❌ Incorrect.\nThe correct answer was: ${correctAnswer}`, threadID, messageID);
    }

    log('info', `User ${senderID} answered "${reply}" for quiz2 in thread ${threadID}. Correct: ${userIndex === handleReply.correctIndex}`);
  }
};
