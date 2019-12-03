const { Command } = require('discord-akairo');

class EnableCommand extends Command {
	constructor() {
		super('enable', {
			aliases: ['enable'],
			category: 'general',
			description: {
				content: 'Enables pings for the user for the specified gym(s).',
				usage: 'Gym Name 1, Gym Name 2, ...',
				examples: ['Best Gym, Ok gym, ....', 'all'],
			},
			args: [
				{
					id: 'gymList',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.gymList) return message.reply('No gyms found in query');

		let gymList = args.gymList.toLowerCase().split(',');
		gymList = gymList.map(x => x.trim());

		let output = '';
		const errors = [];
		const success = [];

		const allGyms = await this.client.userGyms.findAll({ where: { userId: message.author.id } });

		if(allGyms.length == 0) {
			await message.react(message.client.myEmojiIds.failure);
			return message.reply('I do not have you registered in any gyms');
		}

		if(gymList[0] === 'all') {
			try {
				await this.client.userGyms.update(
					{ disabled: 0 },
					{ where : {
						userId: message.author.id,
					} }
				);
				return message.channel.send(`Succesfully enabled your gym list of ${allGyms.length}.`);
			}
			catch(e) {
				console.log('Error in enable command', e);
				return message.channel.send('There was a problem in removing your entries, please bring this to Daro\'s/Anhim\'s attention.');
			}
		}


		// Go through the specified gym list and enable the associated ones.
		for(let i = 0; i < gymList.length; i++) {
			const affectedRows = await this.client.userGyms.update(
				{ disabled: 0 },
				{ where : {
					userId: message.author.id,
					gymName: gymList[i],
				} },
			);

			if(affectedRows > 0) {
				success.push(gymList[i]);
			}
			else {
				console.log(`Error enabling ${gymList[i]} for ${message.author.tag}`);
				errors.push(gymList[i]);
			}
		}
		// End for loop
		const leftover = gymList.filter(x => !success.includes(x) && !errors.includes(x));

		if(success.length > 0) {
			output += `Successfully enabled the following gyms: \n\`\`\`\n${success.join('\n')}\`\`\`\n`;
			await message.react(message.client.myEmojiIds.success);
		}

		if(leftover.length > 0) {
			output += `Could not find gyms by the following names, or you were not registered there: \n\`\`\`\n${leftover.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(errors.length > 0) {
			output += `Could not enable the following gyms due to an unknown error: \n\`\`\`\n${errors.join('\n')}\`\`\``;
			await message.react(message.client.myEmojiIds.failure);
		}
		return message.reply(output);
	}
}

module.exports = EnableCommand;
