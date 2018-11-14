const emojiCharacters = require('../data/emojiCharacters.js');
const list_max = 5;

module.exports = {
	doQuery: async function(author_mention, results, gym, channel_gym, send_chan, selection_done) {
		return new Promise(async (resolve) => {
			let react_out = `Hey${author_mention}, I found a few options, could anyone please specify which gym is correct so I can alert those who are watching for this gym?\n`;
			for(let i = 0; i < list_max; i++) {
				if(i == results.length) break;
				react_out += `${i} - ${results[i].GymName}\n`;
			}
			const react_msg = await send_chan.send(react_out);
			const valid_emojis = [];

			for(let j = 0; j < list_max; j++) {
				if(j == results.length) break;
				valid_emojis.push(emojiCharacters[j]);
				await react_msg.react(emojiCharacters[j]);
			}

			const react_filter = (reaction, user) => {
				return valid_emojis.includes(reaction.emoji.name) && !user.bot;
			};
			try {
				const collected = await react_msg.awaitReactions(react_filter, { max: 1, time: 120000, errors: ['time'] });
				const reaction = collected.first();

				// loop over our emoji numbers to see which index was used
				for(const key in emojiCharacters) {
					if(emojiCharacters.hasOwnProperty(key) && emojiCharacters[key] == reaction.emoji.name) {
						gym = results[key];
						channel_gym = gym.GymName;
					}
				}
				if(!gym) {
					gym = results[0];
					channel_gym = gym.GymName;
				}
			}
			catch(e) {
				console.log('Got no answer for gym precision, defaulting to highest match');
				gym = results[0];
				channel_gym = gym.GymName;
			}
			selection_done = true;

			const return_array = [results, gym, channel_gym, selection_done];
			resolve(return_array);
		});
	},
};
