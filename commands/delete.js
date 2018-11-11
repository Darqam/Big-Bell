const { Command } = require('discord-akairo');

class DeleteCommand extends Command {
	constructor() {
		super('delete', {
			aliases: ['delete', 'del', 'd'],
			channel: 'guild',
			args: [
				{
					id: 'gym_list',
					match: 'content',
					type: 'lowercase',
				},
			],
			userPermissions: ['MANAGE_GUILD'],
		});
	}

	async exec(message, args) {
		if(!args.gym_list) return message.reply('No gyms found in query');
		const gym_list = args.gym_list.split(',');
		const success = [];
		const notExists = [];

		const filter = m => m.author.id == message.author.id;

		await message.channel.send('Are you certain you wish to delete all these gyms?This action **cannot** be reversed? Type `y` or `yes` to delete.');

		message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
			.then(async collected => {
				if(collected.first().content.toLowerCase() == 'y' || collected.first().content.toLowerCase() == 'yes') {

					for(let i = 0; i < gym_list.length; i++) {
						gym_list[i] = gym_list[i].trim();

						const rowCount = await message.client.Gyms.destroy({ where:
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
			})
			.catch(() => {
				return message.reply('Timedout, aborting command');
			});
	}
}

module.exports = DeleteCommand;
