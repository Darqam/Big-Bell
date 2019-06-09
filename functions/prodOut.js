const config = require('../config.json');

module.exports = {
	produceOut: async function(gym, channel, channel_gym, author_id) {
		return new Promise(async (resolve) => {
			// Generating output text to give better map_info on ex raid for this gym
			let ex_out = '';
			if(gym.exRaidNumber) ex_out = `Amount of times this gym has been home to an Ex raid: ${gym.exRaidNumber}`;
			else if(gym.exRaidEligibility) ex_out = `Status of this gym with regards to Ex raids: ${gym.exRaidEligibility}`;

			if(ex_out && gym.gymMap) {
				// Sending without killing embed and extra space after google maps for Meowth to pick up the link
				const tmpMsg = await channel.send(`Here is the proper google maps: ${gym.gymMap} .\nWith directions: <http://mymeanderingmind.com/pokegoMaps/>.\n${ex_out}`);
				console.log(`Sent maps for ${gym.gymName}`);
				// Wait 10 seconds then edit it to not look ugly
				setTimeout(() => {
					tmpMsg.edit(`🔔\nHere is the proper google maps: <${gym.gymMap}>.\nInteractive map: <http://mymeanderingmind.com/pokegoMaps/>.\n${ex_out}`);
				}, 10000);

			}
			else {
				console.log(`Did not have map and Ex raid info for ${gym.gymName}.`);
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
				else {
					console.log('Could not save to DB that channel was pinged');
					console.log(e);
				}
			}

			// Check if anyone is registered for this gym
			if(!gym.userIds) return console.log(`No users for ${channel_gym}.`);

			// Here we start dealing with building up the mention list
			let users_arr = gym.userIds.split(',');

			if(author_id) {
				users_arr = users_arr.filter(id => id != author_id).map(id => `<@${id}>`);
			}
			else {
				users_arr = users_arr.map(id => `<@${id}>`);
			}
			// If there are no users for this gym, stop
			if(users_arr.length < 1) return console.log(`No users for ${channel_gym} aside from author.`);

			// Purely for fun
			const affectedRows = await channel.client.Gyms.update(
				{ timesPinged: gym.timesPinged + 1 },
				{ where : {
					gymName: channel_gym,
					guildId: channel.guild,
				} },
			);

			if(affectedRows <= 0) console.log(`Error incrementing for gym ${channel_gym}`);

			// Since this has the potential to be a massive message, tell
			// djs to split the message at ~1900 characters and split by the
			// comma character which will be in between each mention.
			const final_return = `🔔🔔🔔 ${users_arr.join(',')} 🔔🔔🔔\nIf you wish to no longer be notified for this gym, please type \`${config.prefix}remove ${channel_gym}\``;

			const return_array = [final_return, channel_gym, disabled];
			resolve(return_array);
		});
	},
};
