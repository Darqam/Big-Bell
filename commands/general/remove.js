const { Command } = require('discord-akairo');

class RemoveCommand extends Command {
	constructor() {
		super('remove', {
			aliases: ['remove', 'r', 'unwant'],
			category: 'general',
			description: {
				content: 'Removes the author from specified gym lists.',
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
				await this.client.userGyms.destroy({ where: { userId: message.author.id } });
				return message.channel.send(`Succesfully removed you from ${allGyms.length}.`);
			}
			catch(e) {
				console.log('Error in remove command', e);
				return message.channel.send('There was a problem in removing your entries, please bring this to Daro\'s/Anhim\'s attention.');
			}
		}


		// Go through the specified gym list and remove the associated ones.
		for(let i = 0; i < allGyms.length; i++) {
			try {
				await this.client.userGyms.destroy({
					where: {
						userId: message.author.id,
						gymName: allGyms[i].gymName,
					},
				});
				success.push(gymList[i]);
			}
			catch(e) {
				console.log(`Error removing ${gymList[i]} for ${message.author.tag}`, e);
				errors.push(gymList[i]);
			}
		}
		// End for loop
		const leftover = gymList.filter(x => !success.includes(x) && !errors.includes(x));

		if(success.length > 0) {
			output += `Successfully removed you from: \n\`\`\`\n${success.join('\n')}\`\`\`\n`;
			if(gymList[0] === 'all') output += 'If this was temporary, consider using the disable command next time, might be faster than running this and adding them back later.';
			await message.react(message.client.myEmojiIds.success);
		}

		if(leftover.length > 0) {
			output += `Could not find gyms by the following names, or you were not registered there: \n\`\`\`\n${leftover.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		if(errors.length > 0) {
			output += `Could not remove you to the following gyms due to an unknown error: \n\`\`\`\n${errors.join('\n')}\`\`\``;
			await message.react(message.client.myEmojiIds.failure);
		}
		return message.reply(output);
	}
}

module.exports = RemoveCommand;
