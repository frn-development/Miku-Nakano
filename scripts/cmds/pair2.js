const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('../../logger/logger');

module.exports = {
    config: {
        name: 'pair2',
        version: '1.0',
        author: 'Farhan',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'Pairs you with a random group member using another love image.',
        category: 'fun',
        guide: {
            en: '   {pn}'
        },
    },

    onStart: async ({ api, event }) => {
        const { threadID, senderID } = event;

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const { participantIDs } = threadInfo;

            if (participantIDs.length < 2) {
                return api.sendMessage("❌ Not enough members to pair.", threadID);
            }

       
            let partnerID;
            do {
                partnerID = participantIDs[Math.floor(Math.random() * participantIDs.length)];
            } while (partnerID === senderID);

            const [senderInfo, partnerInfo] = await Promise.all([
                api.getUserInfo(senderID),
                api.getUserInfo(partnerID)
            ]);

            const senderName = senderInfo[senderID]?.name || 'Unknown';
            const partnerName = partnerInfo[partnerID]?.name || 'Unknown';

            const lovePercentage = Math.floor(Math.random() * 51) + 50;

            const image1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const image2 = `https://graph.facebook.com/${partnerID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            const apiUrl = `https://sus-apis-2.onrender.com/api/love?image1=${encodeURIComponent(image1)}&image2=${encodeURIComponent(image2)}`;
            console.log(`[PAIR2] Requesting: ${apiUrl}`);

            const apiResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const cacheDir = path.join(__dirname, '..', 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `pair2_${senderID}_${partnerID}.png`);
            fs.writeFileSync(imagePath, Buffer.from(apiResponse.data, 'binary'));

            const messageBody = `💘 Match Made!\n\n🥰 ${senderName} ❤ ${partnerName}\n💯 Love Compatibility: ${lovePercentage}%`;

            api.sendMessage({
                body: messageBody,
                mentions: [
                    { tag: senderName, id: senderID },
                    { tag: partnerName, id: partnerID }
                ],
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => fs.unlinkSync(imagePath));

            log('info', `Pair2 executed by ${senderID} → ${partnerID} in thread ${threadID}`);
        } catch (error) {
            console.error("Error in pair2 command:", error);
            log('error', `Pair2 error: ${error.message}`);
            api.sendMessage("❌ An error occurred while creating your pair.", threadID);
        }
    },
};
