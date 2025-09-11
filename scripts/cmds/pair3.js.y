const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


function drawRoundedImage(ctx, image, x, y, width, height, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
}


function drawCircularImage(ctx, image, x, y, diameter) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + diameter / 2, y + diameter / 2, diameter / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, x, y, diameter, diameter);
    ctx.restore();
}

module.exports = {
    config: {
        name: 'pair3',
        version: '1.3',
        author: 'Farhan',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'Pairs you with a random person from the group.',
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
                return api.sendMessage("There aren't enough people in this group to find a pair.", threadID);
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

            
            const backgroundPath = path.join(__dirname, '..', '..', 'assets', 'love.png');
            const backgroundImage = await loadImage(backgroundPath);

            const avatarSenderUrl = `https://graph.facebook.com/${senderID}/picture?width=400&height=400&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatarPartnerUrl = `https://graph.facebook.com/${partnerID}/picture?width=400&height=400&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            const [avatarSender, avatarPartner] = await Promise.all([
                axios.get(avatarSenderUrl, { responseType: 'arraybuffer' }).then(res => loadImage(res.data)),
                axios.get(avatarPartnerUrl, { responseType: 'arraybuffer' }).then(res => loadImage(res.data))
            ]);

            const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

           
            const avatarSize = 500; 
            
          
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
       
            const horizontalSpacing = 500; 
        
            const verticalOffset = -20;
           
            

            const leftAvatarX = centerX - horizontalSpacing - avatarSize / 1.5;
            const rightAvatarX = centerX + horizontalSpacing - avatarSize / 40;
            const avatarY = centerY + verticalOffset - avatarSize / 2;

         
            
            drawCircularImage(ctx, avatarSender, leftAvatarX, avatarY, avatarSize);
            drawCircularImage(ctx, avatarPartner, rightAvatarX, avatarY, avatarSize);

        
            

            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = 3; 
            ctx.beginPath();
            ctx.arc(leftAvatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(rightAvatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.stroke();

            
            
            ctx.fillStyle = '#ffffff'; 
            ctx.font = 'bold 70px Arial'; 
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000'; 
            ctx.lineWidth = 2; 
            
    
            const nameVerticalOffset = 50;
            const nameY = avatarY + avatarSize + nameVerticalOffset;
            


            ctx.strokeText(senderName, leftAvatarX + avatarSize / 2, nameY);
            ctx.fillText(senderName, leftAvatarX + avatarSize / 2, nameY);
            
            ctx.strokeText(partnerName, rightAvatarX + avatarSize / 2, nameY);
            ctx.fillText(partnerName, rightAvatarX + avatarSize / 2, nameY);

       
            ctx.fillStyle = '#ffffff'; 
            ctx.font = 'bold 100px Arial'; 
            ctx.strokeStyle = '#ff1493'; 
            ctx.lineWidth = 2; 
            
            
            const percentageHorizontalOffset = 70; 
            const percentageVerticalOffset = 80; 
            
            const percentageText = `${lovePercentage}%`;
            const percentageX = centerX + percentageHorizontalOffset;
            const percentageY = centerY + percentageVerticalOffset;
            
            ctx.strokeText(percentageText, percentageX, percentageY);
            ctx.fillText(percentageText, percentageX, percentageY);


            const cacheDir = path.join(__dirname, '..', 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }
            const imagePath = path.join(cacheDir, `pair_${senderID}_${partnerID}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);

            const messageBody = `💕 Successful Pairing! 💕\n\n${senderName} & ${partnerName}\n\nLove Percentage: ${lovePercentage}%`;
            
            api.sendMessage({
                body: messageBody,
                mentions: [
                    { tag: senderName, id: senderID },
                    { tag: partnerName, id: partnerID }
                ],
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => fs.unlinkSync(imagePath));

        } catch (error) {
            console.error("Error in pair command:", error);
            api.sendMessage("Sorry, an error occurred while creating your pair.", threadID);
        }
    },
};
