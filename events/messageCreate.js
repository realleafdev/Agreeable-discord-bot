const { Ollama } = require('ollama');
const fs = require('fs');
const { channelId, clientName, clientId, ollamaLink, historyPath, messageDelimiter, messageHistoryCap, accessDisplayName, modelName } = require('../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        let messageContent = message.content.toLowerCase();
        messageContent.replaceAll('\n', messageDelimiter);
        if (messageContent.includes(clientName.toLowerCase()) || message.mentions.has(clientId)) {
            if (message.channel.id === channelId && message.author.id !== clientId) {
                // All checks are done, starts creating the ollama request.
                await message.channel.sendTyping();
                const ollama = new Ollama({ host: ollamaLink });

                if (message.content[0] === '<') {
                    messageContent = message.content.slice(23, message.content.length);
                }

                // More system prompt formatting

                let formattedMessage = { role: 'user', content: message.author.username + messageDelimiter + messageContent };

                if (accessDisplayName) {
                    // Fetch the member object for the author
                    const member = await message.guild.members.fetch(message.author.id);

                    const username = message.author.username;
                    
                    // member.displayName gives the server nickname if it exists, else the username
                    const nickname = member.displayName;

                    messageHistory.messages.content = messageHistory.messages.content + 'Some users will have <username> <nickname> <message>, you can pick whatever to call them.';

                    formattedMessage = { role: 'user', content: username + messageDelimiter + nickname + messageDelimiter + messageContent };
                }

                console.log(`Full formatted user message: ${formattedMessage}`);

                // Gets the Json file as a Jsonstring.
                const stringHistory = fs.readFileSync(historyPath, 'utf8');
                
                // Parses the file into a dictionary.
                const messageHistory = JSON.parse(stringHistory);

                // System prompt formatting

                

                messageHistory.messages.content = messageHistory.messages.content + `You have access to the last ${messageHistory.messages.length} messages in the online chat.`;

                // if (finkieChat) {

                //     messageHistory.messages.content = messageHistory.messages.content + finkieInstructions;
                // }

                // Adds the user's message to the message history dictionary.
                messageHistory.messages.push(formattedMessage);
                
                // Writes the updated message history back to the jsonfile as a Jsonstring.
                fs.writeFileSync(historyPath, JSON.stringify(messageHistory, null, 2), 'utf8');
                
                // Logs
                console.log('Successfully entered user message to message history.');
                console.log(`The message history: ${messageHistory}`);
                
                // Sending the history to the AI model.
                const response = await ollama.chat({
                model: modelName,
                messages: messageHistory.messages,
                options: {
                    temperature: 0.7,
                    num_predict: 1000,
                },
                });

                const responseContent = response.message.content;
                
                // Replies to the user with a message.
                message.reply(responseContent);
                
                const formattedResponse = { role: 'assistant', content: responseContent };

                console.log(`The full response: ${formattedResponse}`);
        
                messageHistory.messages.push(formattedResponse);

                fs.writeFileSync(historyPath, JSON.stringify(messageHistory, null, 2), 'utf8');
                
                console.log('Successfully entered assistant message to message history.');

                // Removing messages over the cap.
                if (messageHistory.messages.length > messageHistoryCap) {
                    // To avoid deleting the system prompt starting index is 1.
                    const startingIndex = 1;
                    // We are deleting 2 messages, 1 from the user and 1 from the AI.
                    const deleteCount = 2;
                    messageHistory.messages.splice(startingIndex, deleteCount);
                    fs.writeFileSync(historyPath, JSON.stringify(messageHistory, null, 2), 'utf8');

                }

            }
        }
    },
};
