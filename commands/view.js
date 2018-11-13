const { Command } = require('discord-akairo');

class ViewCommand extends Command {
	constructor() {
		super('view', {
			aliases: ['view', 'v', 'list'],
			description: 'Lets the user view which gyms they are subscribed to',
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

		/* const tagString = tagList.map(t => t.name).join(', ') || 'No tags set.';
		return message.channel.send(`List of tags: ${tagString}`); */
	}
}

module.exports = ViewCommand;
