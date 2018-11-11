const { Command } = require('discord-akairo');

class DeleteCommand extends Command {
	constructor() {
		super('delete', {
			aliases: ['delete', 'del', 'd'],
			args: [
				{
					id: 'gym_list',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		const gym_list = args.gym_list.split(',');
		const success = [];
		const notExists = [];

		for(let i = 0; i < gym_list.length; i++) {
			gym_list[i] = gym_list[i].trim();

			const rowCount = await this.client.Gyms.destroy({ where:
				{ GymName: gym_list[i] },
			});
			if(!rowCount) notExists.push(gym_list[i]);
			else success.push(gym_list[i]);
		}
		let output = '';
		if(success.length > 0) {
			output += `Successfully deleted instances for: \n\`\`\`\n${success.join('\n')}\`\`\`\n`;
			await message.react('511174612323663874');
		}

		if(notExists.length > 0) {
			output += `Could not find a gym by the name: \n\`\`\`\n${notExists.join('\n')}\`\`\`\n`;
			await message.react('❓');
		}

		return message.reply(output);
	}
}

module.exports = DeleteCommand;
