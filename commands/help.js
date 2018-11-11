const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');

class HelpCommand extends Command {
	constructor() {
		super('help', {
			aliases: ['help', 'halp', 'h'],
			description: 'help\nLists overall usage and description for commands',
			args: [{
				id: 'command',
				default: 'showall',
			}],
		});
	}

	async exec(message) {
		const prefix = this.client.commandHandler.prefix;
		// if(args.command == 'showall') {
		const helpEmbed = new MessageEmbed()
			.setTitle('Command Name')
			.setDescription('Usage + Description');
		this.client.commandHandler.modules.forEach(m => {
			helpEmbed.addField(m.id, prefix + m.description);
		});
		message.channel.send(helpEmbed);
		// }
	}
}

module.exports = HelpCommand;
