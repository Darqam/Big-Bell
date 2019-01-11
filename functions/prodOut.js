const config = require('../config.json');
const { stripIndents } = require('common-tags');

module.exports = {
	produceOut: async function(gym, channel, channel_gym, selection_done, author_id, send_chan) {
		return new Promise(async (resolve) => {
			// Generating output text to give better map_info on ex raid for this gym
			let ex_out = '';
			if(gym.exRaidNumber) ex_out = `Amount of times this gym has been home to an Ex raid: ${gym.exRaidNumber}`;
			else if(gym.exRaidEligibility) ex_out = `Status of this gym with regards to Ex raids: ${gym.exRaidEligibility}`;

			if(ex_out && gym.gymDirections) {
				// Sending without killing embed and extra space after google maps for Meowth to pick up the link
				const tmpMsg = await channel.send(`🔔\nHere is the proper google maps: ${gym.gymMap} .\nWith directions: <${gym.gymDirections}>.\n${ex_out}`);

				// Wait 10 seconds then edit it to not look ugly
				setTimeout(() => {
					tmpMsg.edit(`🔔\nHere is the proper google maps: <${gym.gymMap}>.\nWith directions: <${gym.gymDirections}>.\n${ex_out}`);
				}, 10000);

			}
			else {
				console.log(`Did not have map and Ex raid info for ${gym.GymName}.`);
			}

			// Let's make sure this is only ever done once.
			let disabled = false;
			try {
				await channel.client.Announcements.create({
					channelId: channel.id,
				});
				console.log('Saved to DB that channel was pinged');
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					console.log('Attempt at 2nd list ping disabled.');
					disabled = true;
				}
				console.log('Could not save to DB that channel was pinged');
				console.log(e);
			}

			// Check if anyone is registered for this gym
			if(!gym.userIds) {
				console.log(`No users for ${channel_gym}.`);
				if(selection_done) send_chan.send('No one has this gym on their watchlist, keeping quiet.');
				return;
			}

			// Here we start dealing with building up the mention list
			let users_arr = gym.userIds.split(',');

			if(author_id) {
				users_arr = users_arr.filter(id => id != author_id).map(id => `<@${id}>`);
			}
			else {
				users_arr = users_arr.map(id => `<@${id}>`);
			}
			if(users_arr.length < 1) {
				// If there are no users for this gym, stop
				console.log(`No users for ${channel_gym} aside from author.`);
				if(selection_done) send_chan.send('No one but the author has this gym on their watchlist, keeping quiet.');
				return;
			}

			// Purely for fun
			const affectedRows = await channel.client.Gyms.update(
				{ timesPinged: gym.timesPinged + 1 },
				{ where : { GymName: channel_gym } },
			);
			if(affectedRows <= 0) console.log(`Error incrementing for gym ${channel_gym}`);

			// Since this has the potential to be a massive message, tell
			// djs to split the message at ~1900 characters and split by the
			// comma character which will be in between each mention.
			const final_return = stripIndents`🔔🔔🔔
			BONG!
			Raid announced for the gym \`${channel_gym}\` in ${channel}.
			Consider ye selves notified!
			🔔🔔🔔
			${users_arr.join(',')}

			If you wish to no longer be notified for this gym, please type \`${config.prefix}remove ${channel_gym}\``;

			const return_array = [final_return, channel_gym, disabled];
			resolve(return_array);
		});
	},
};
