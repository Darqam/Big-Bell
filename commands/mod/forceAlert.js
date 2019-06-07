const { Command } = require('discord-akairo');
const chanName = require('../../functions/isolateNames.js');
const multiResult = require('../../functions/multiResult.js');
const chanList = require('../../functions/findGyms.js');
const prodOut = require('../../functions/prodOut.js');
const saveRaids = require('../../functions/saveRaids.js');

class ForceAlertCommand extends Command {
	constructor() {
		super('forceAlert', {
			aliases: ['forceAlert', 'fAlert', 'forcePing', 'fPing'],
			category: 'mod',
			channel: 'guild',
			description: {
				content: 'Will alert players about the gym. Must be used in a raid channel.',
				usage: '',
			},
			args: [
				{
					id: 'gym',
					match: 'content',
					type: 'lowercase',
				},
			],
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
		let channel_gym = args.gym ? args.gym : chanName.getChanGym(message.channel);
		if(!channel_gym) return console.log('Not in a proper channel.');

		// Now we deal with the logic
		let found = false;
		let results = [];
		let selection_done = false;

		let gym = await this.client.Gyms.findOne({
			where: {
				gymName: channel_gym,
			},
		});
		if(!gym) {
			const func_return = await chanList.getGymNames(this.client, channel_gym);
			results = func_return[0];
			found = func_return[1];
			gym = func_return[2];
			channel_gym = func_return[3];
		}
		else {
			found = true;
		}
		// results is an array of gym objects, let loop through those to see if any "discord sanitized" channel name is found first.
		const filterResults = results.filter(gymMatch => {
			return gymMatch.gymName.replace(/[^a-zA-Z0-9\s]+/g, '') == channel_gym;
		});
		if(filterResults.length == 1) {
			gym = filterResults[0];
			channel_gym = gym.gymName.replace(/[^a-zA-Z0-9\s]+/g, '');
			selection_done = true;
		}

		if(found) {
			if(results.length > 1 && !gym) {
				const f_r = await multiResult.doQuery(`<@${message.author.id}>`, results, gym, channel_gym, message.channel);

				// Abort
				if(f_r[3] == true) return undefined;

				results = f_r[0];
				gym = f_r[1];
				channel_gym = f_r[2];
				selection_done = true;
			}
			const fi_r = await prodOut.produceOut(gym, message.channel, channel_gym, selection_done, message.author.id, message.channel);
			const final_return = fi_r[0];
			channel_gym = fi_r[1];

			message.channel.send(final_return, { split: { maxLength: 1900, char: ',' } });
			saveRaids.saveLiveRaids(message.channel, channel_gym, gym, true);
		}
		else {
			return message.channel.send('Could not find a gym based on the channel name.');
		}
	}
}

module.exports = ForceAlertCommand;
