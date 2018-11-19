const { Command } = require('discord-akairo');

class ViewCommand extends Command {
	constructor() {
		super('view', {
			aliases: ['view', 'v', 'list'],
			category: 'general',
			description: {
				content: 'Disaplys which gyms the author is monitoring.',
				usage: '',
			},
		});
	}

	async exec(message) {
		const gymList = await this.client.Gyms.findAll({ attributes: ['GymName', 'userIds'] });
		const userGyms = [];
		gymList.forEach(gym => {
			if (gym.userIds.split(',').includes(message.author.id)) {
				userGyms.push(gym.GymName);
			}
		});
		if(userGyms.length > 0) return message.reply(`You currently have alerts for the following gyms:\n\`\`\`\n${userGyms.join('\n')}\`\`\``);
		return message.reply('You currently are registered to recieve no alerts.');
	}
}

module.exports = ViewCommand;
