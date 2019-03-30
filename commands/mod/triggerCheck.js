const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { getTriggers } = require('../../functions/getTriggers.js');


class TriggerCheckCommand extends Command {
	constructor() {
		super('triggerCheck', {
			aliases: ['triggerCheck', 'tc'],
			category: 'mod',
			description: {
				content: 'Checks current matching for trigger channels.',
				usage: '',
			},
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

	async exec(message) {
		let roleMap = await getTriggers(message.guild);
		roleMap = roleMap.sort((r1, r2) => r1.number - r2.number);
		const embed = new MessageEmbed()
			.setTitle('Trigger check status...');
		roleMap.forEach(x => {
			embed.addField(`Trigger #${x.number}`, `${x.role}\nValid gyms: ${x.validGymNames}\nInvalid gyms: ${x.invalidGymNames}`);
		});
		message.channel.send({ embed });
	}
}

module.exports = TriggerCheckCommand;
