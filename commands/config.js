const { Command } = require('discord-akairo');

class ConfigCommand extends Command {
	constructor() {
		super('config', {
			aliases: ['config'],
			args: [
				{
					id: 'channel_id',
					match: 'content',
				},
			],
			userPermissions: ['MANAGE_GUILD'],
		});
	}

	async exec(message, args) {
		if(!message.guild.channels.has(args.channel_id)) return message.channel.send('Could not find a channel by that id in this guild.');

		const guildConfig = await this.client.Config.findOne({
			where: { guildId: message.guild.id },
		});
		if(!guildConfig) {
			// If there isn't any configs for this guild, set it up
			try {
				await this.client.Config.create({
					guildId: message.guild.id,
					announcementChan: args.channel_id,
				});
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					console.log('butwhy');
				}
				else {
					console.log(e);
					return message.channel.send('Error while creating guild config, error dumped to logs');
				}
			}
			return message.channel.send(`Updated announcement channel to ${message.guild.channels.get(args.channel_id)}`);
		}
		else {
			const affectedRows = await this.client.Config.update(
				{ announcementChan: args.channel_id },
				{ where : { guildId: message.guild.id } },
			);

			if(affectedRows > 0) {
				message.channel.send(`Updated announcement channel to ${message.guild.channels.get(args.channel_id)}`);
			}
			else {
				message.channel.send('Failed to update configs :/');
			}
		}
	}
}

module.exports = ConfigCommand;
