const { Command } = require('discord-akairo');

class DeleteCommand extends Command {
	constructor() {
		super('delete', {
			aliases: ['delete', 'del'],
			category: 'mod',
			description: {
				content: 'Deletes the given gyms from the database.',
				usage: 'Gym Name 1, Gym Name 2, ...',
			},
			args: [
				{
					id: 'gym_list',
					match: 'content',
					type: 'lowercase',
				},
			],
			channelRestriction: 'guild',
		});
	}

	userPermissions(message) {
		if(message.member.permissions.has('MANAGE_GUILD') || message.author.id == '129714945238630400') {
			return null;
		}
		else {
			return 'Moderator';
		}
	}

	async exec(message, args) {
		if(!args.gym_list) return message.reply('No gyms found in query');
		const gym_list = args.gym_list.split(',');
		const success = [];
		const notExists = [];

		const filter = m => m.author.id == message.author.id;

		await message.channel.send('Are you certain you wish to delete all these gyms? This action **cannot** be reversed. Type `y` or `yes` to delete.');

		message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ['time'] })
			.then(async collected => {
				if(collected.first().content.toLowerCase() == 'y' || collected.first().content.toLowerCase() == 'yes') {

					for(let i = 0; i < gym_list.length; i++) {
						gym_list[i] = gym_list[i].trim();

						const rowCount = await message.client.Gyms.destroy({ where:
							{ gymName: gym_list[i] },
						});
						if(!rowCount) {
							notExists.push(gym_list[i]);
						}
						else {
							// Now we also remove this gym from the pinging list of userGyms
							await message.client.userGyms.destroy({ where:
								{ gymName: gym_list[i] },
							});
							success.push(gym_list[i]);
						}
					}
					let output = '';
					if(success.length > 0) {
						output += `Successfully deleted instances for: \n\`\`\`\n${success.join('\n')}\`\`\`\n`;
						await message.react(message.client.myEmojiIds.success);
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
