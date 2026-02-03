const fs = require('fs');
const { historyPath, systemPrompt, resetHistoryOnLaunch } = require('../config.json');


module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {

		try {
			// Gets the Json file as a Jsonstring.
			const stringHistory = fs.readFileSync(historyPath, 'utf8');
			
			// Parses the file into a dictionary.
			const messageHistory = JSON.parse(stringHistory);
			
			if (resetHistoryOnLaunch) {
				// Resets the message history.
				messageHistory.messages = [systemPrompt];
			}

			// Writes the updated message history back to the jsonfile as a Jsonstring.
			fs.writeFileSync(historyPath, JSON.stringify(messageHistory, null, 2), 'utf8');

			console.log('Successfully cleared message history.');

			} catch (error) {
			console.error('Error handling JSON file:', error);
			}

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};

