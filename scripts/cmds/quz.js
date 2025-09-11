const axios = require('axios');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'quiz',
    version: '1.1',
    author: 'Farhan',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'Bangla quiz game. Use without category for random, or give a category.',
    category: 'game',
    guide: {
      en: '{pn}quiz\n{pn}quiz <category>'
    }
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const senderID = event.senderID;
    let category = args.join(' ').trim();

    try {
      let quizData;
    
      if (category) {
       
        const catRes = await axios.get('https://bangla-quiz-db.vercel.app/api/categories');
        const categories = catRes.data.map(x => x.trim());
        if (!categories.includes(category)) {
          return api.sendMessage(
            '❌ দয়া করে একটি বৈধ ক্যাটাগরি দিন।\nAvailable: ' + categories.join(', '),
            threadID,
            event.messageID
          );
        }
    
        const quizRes = await axios.get(`https://bangla-quiz-db.vercel.app/api/random/${encodeURIComponent(category)}`);
        quizData = quizRes.data;
        if (!quizData || !quizData.question) {
          return api.sendMessage('❌ এই ক্যাটাগরির জন্য কুইজ পাওয়া যায়নি।', threadID, event.messageID);
        }
      } else {
       
        const quizRes = await axios.get('https://bangla-quiz-db.vercel.app/api/random');
        quizData = quizRes.data;
      }

      const optionA = quizData.options1 || quizData.option1;
      const optionB = quizData.options2 || quizData.option2;
      const optionC = quizData.options3 || quizData.option3;
      const answerKey = quizData.answer;

      const quizMsg = `❓ [${quizData.category}] ${quizData.question}\n\na) ${optionA}\nb) ${optionB}\nc) ${optionC}\n\nজবাব দিতে a, b, c রিপ্লাই দিন।`;
      const sentMsg = await api.sendMessage(quizMsg, threadID);


      global.client.handleReply.push({
        name: 'quiz',
        messageID: sentMsg.messageID,
        threadID,
        senderID,
        answerKey,
        options: [optionA, optionB, optionC],
        timeout: setTimeout(async () => {

          const idx = global.client.handleReply.findIndex(e => e.messageID === sentMsg.messageID && e.name === 'quiz');
          if (idx >= 0) global.client.handleReply.splice(idx, 1);
          await api.sendMessage('⏰ সময় শেষ! আপনি কোন উত্তর দেননি।', threadID);
        }, 60000) 
      });

      log('info', `Quiz sent to ${senderID} in thread ${threadID}`);

    } catch (error) {
      log('error', `Quiz command error: ${error.message}`);
      api.sendMessage('❌ কুইজ আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন!', event.threadID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const reply = event.body.trim().toLowerCase();
    const threadID = event.threadID;
    const senderID = event.senderID;

  
    if (!event.messageReply || event.messageReply.messageID !== handleReply.messageID) {
      return api.sendMessage('⚠️ এটি আমার কুইজের রিপ্লাই নয়!', threadID, event.messageID);
    }

    if (!['a', 'b', 'c'].includes(reply)) {
      return api.sendMessage('⚠️ শুধুমাত্র "a", "b" অথবা "c" ব্যবহার করুন!', threadID, event.messageID);
    }

 
    const idx = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID && e.name === 'quiz');
    if (idx >= 0) {
      clearTimeout(global.client.handleReply[idx].timeout);
      global.client.handleReply.splice(idx, 1);
    }

 
    const ansMap = { a: 0, b: 1, c: 2 };
    const userOptionIdx = ansMap[reply];
    const correctIdx = ({
      'options1': 0, 'option1': 0,
      'options2': 1, 'option2': 1,
      'options3': 2, 'option3': 2
    })[handleReply.answerKey];

    if (userOptionIdx === correctIdx) {
      await api.sendMessage('✅ ঠিক উত্তর! 🎉', threadID, event.messageID);
    } else {
      await api.sendMessage(`❌ ভুল উত্তর!\nসঠিক উত্তর: ${handleReply.options[correctIdx]}`, threadID, event.messageID);
    }
    log('info', `User ${senderID} replied "${reply}" for quiz in thread ${threadID}. Correct: ${userOptionIdx === correctIdx}`);
  }
};
