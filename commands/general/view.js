const { Command } = require('discord-akairo');

class ViewCommand extends Command {
	constructor() {
		super('view', {
			aliases: ['view', 'v', 'list'],
			category: 'general',
			description: {
				content: 'Displays which gyms the author is monitoring.',
				usage: '',
			},
		});
	}

	async exec(message) {
		const gymList = await this.client.userGyms.findAll({ where: { userId: message.author.id }	});
		const userGyms = gymList.map(gym => gym.gymName);

		if(userGyms.length > 0) return message.reply(`You currently have alerts for the following gyms:\n\`\`\`\n${userGyms.join('\n')}\`\`\``);
		return message.reply('You currently are registered to recieve no alerts.');
	}
}

module.exports = ViewCommand;
