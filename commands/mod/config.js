const { Command } = require('discord-akairo');

class ConfigCommand extends Command {
	constructor() {
		super('config', {
			aliases: ['config'],
			category: 'mod',
			description: {
				content: 'Allows for setting of alert channel.',
				usage: '#channelName',
			},
			args: [
				{
					id: 'sendChannel',
					type: 'channelMention',
					match: 'content',
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
		// This feels stupid but also safe
		const channel_id = args.sendChannel.id;
		if(!message.guild.channels.has(channel_id)) return message.channel.send('Could not find a channel by that id in this guild.');

		const guildConfig = await this.client.Config.findOne({
			where: { guildId: message.guild.id },
		});
		if(!guildConfig) {
			// If there isn't any configs for this guild, set it up
			try {
				await this.client.Config.create({
					guildId: message.guild.id,
					announcementChan: channel_id,
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
			return message.channel.send(`Updated announcement channel to ${message.guild.channels.get(channel_id)}`);
		}
		else {
			const affectedRows = await this.client.Config.update(
				{ announcementChan: channel_id },
				{ where : { guildId: message.guild.id } },
			);

			if(affectedRows > 0) {
				message.channel.send(`Updated announcement channel to ${message.guild.channels.get(channel_id)}`);
			}
			else {
				message.channel.send('Failed to update configs :/');
			}
		}
	}
}

module.exports = ConfigCommand;
