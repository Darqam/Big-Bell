const { Command } = require('discord-akairo');

class ConfigCommand extends Command {
	constructor() {
		super('config', {
			aliases: ['config'],
			category: 'mod',
			description: {
				content: 'Allows for modification of prefixes.',
				usage: '<add | remove> <relevantPrefix>',
			},
			args: [
				{
					id: 'add',
					match: 'option',
					flag: 'add:',
				},
				{
					id: 'remove',
					match: 'option',
					flag: 'remove:',
				},
				{
					id: 'timezone',
					match: 'option',
					flag: 'timezone:',
				},
				{
					id: 'show',
					match: 'flag',
					flag: '--show',
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
		let guildConfig = await this.client.Guilds.findOne({
			where: { guildId: message.guild.id },
		});
		if(!guildConfig) {
			// If there isn't any configs for this guild, set it up
			try {
				guildConfig = await this.client.Guilds.create({
					guildId: message.guild.id,
					timezone: '0',
					prefixes: ['bb!'].join(),
				});
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					console.log('butwhy');
					return message.channel.send('Unique constraint error.');
				}
				else {
					console.log(e);
					return message.channel.send('Error while creating guild config, error dumped to logs');
				}
			}
		}
		// At this point we have a valid config table for the guild

		let current = guildConfig.prefixes.split(',');
		let curTZ = guildConfig.timezone;

		if(args.add && !current.includes(args.add)) current.push(args.add);
		if(args.remove) current = current.filter(v => v != args.remove);

		if(args.add || args.remove) {
			const affectedRows = await this.client.Guilds.update(
				{ prefixes: current.join() },
				{ where : { guildId: message.guild.id } },
			);

			if(affectedRows > 0) {
				message.channel.send(`Successfully updated prefix, valid prefixes are now \`${current}\``);
			}
			else {
				message.channel.send('Failed to update prefixes :/');
			}
		}

		// Now we check timezone setup
		if(args.timezone) {
			if(!/^[+-]?\d{1,2}$/.test(args.timezone)) return message.channel.send('Timezone did not match expected format of +/-##');
			curTZ = args.timezone;
			const affectedRows = await this.client.Guilds.update(
				{ timezone: args.timezone },
				{ where : { guildId: message.guild.id } },
			);

			if(affectedRows > 0) {
				message.channel.send(`Successfully updated timezone to ${args.timezone}`);
			}
			else {
				message.channel.send('Failed to update timezone :/');
			}
		}

		// Check if they want everything shown
		if(args.show) return message.channel.send(`Guild id: ${message.guild.id}\nPrefixes: \`${current}\`\nTimezone: ${curTZ}`);
	}
}

module.exports = ConfigCommand;
