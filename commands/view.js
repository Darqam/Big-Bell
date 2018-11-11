const { Command } = require('discord-akairo');

class ViewCommand extends Command {
	constructor() {
		super('view', {
			aliases: ['view', 'v'],
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
		return message.reply(`You currently have alerts for the following gyms:\n\`\`\`\n${userGyms.join('\n')}\`\`\``);

		/* const tagString = tagList.map(t => t.name).join(', ') || 'No tags set.';
		return message.channel.send(`List of tags: ${tagString}`); */
	}
}

module.exports = ViewCommand;
