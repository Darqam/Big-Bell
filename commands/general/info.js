const { Command } = require('discord-akairo');
const { stripIndents } = require('common-tags');

class InfoCommand extends Command {
	constructor() {
		super('info', {
			aliases: ['info', 'i'],
			category: 'general',
			description: {
				content: 'Shows some info for the given gym.',
				usage: 'Gym Name',
			},
			args: [
				{
					id: 'gym_name',
					match: 'content',
					type: 'lowercase',
				},
			],
			channelRestriction: 'guild',
		});
	}

	async exec(message, args) {
		if(!args.gym_name) return message.reply('No gyms found in query');
		const gym_name = args.gym_name.trim();

		const gym = await this.client.Gyms.findOne({
			where: {
				guildId: message.guild.id,
				gymName: gym_name,
			},
		});
		const userGyms = await this.client.userGyms.findAll({
			where: {
				gymId: gym.id,
			},
		});
		if(gym) {
			const length = userGyms.length;
			return message.channel.send(stripIndents`Gym name: ${gym_name}
				Amount of people monitoring this gym: ${length}
				Gym list was pinged ${gym.timesPinged} times
				Map for the gym <${gym.gymMap}>
				Directions to the gym: <${gym.gymDirections}>
				Times this gym hosted an Ex Raid: ${gym.exRaidNumber}
				Eligibility of gym for Ex Raids: ${gym.exRaidEligibility}
				`);
		}
		else {
			return message.reply(`Could not find a gym by the name of ${gym_name}.`);
		}
	}
}

module.exports = InfoCommand;
