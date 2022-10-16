const { Listener } = require('discord-akairo');

class MessageListener extends Listener {
	constructor() {
		super('message', {
			emitter: 'client',
			event: 'message',
		});
	}

	async exec(message) {
		if(message.author.bot) return;
		if(!message.guild) return console.log(`DM ran: <@${message.author.id}> => ${message.content}`);

		const guildConfigs = await message.client.Guilds.findOne({
			where: {
				guildId: message.guild.id,
			},
		});
		const prefixes = guildConfigs ? guildConfigs.prefixes.split(',') : ['bb!'];

		if(!prefixes.some(p => message.content.startsWith(p))) return;

		return console.log(`Command ran: <@${message.author.id}> => ${message.content}`);
	}
}

module.exports = MessageListener;
