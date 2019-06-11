const raidMons = require('../data/raid_pokemons.json');
const chanName = require('./isolateNames.js');

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

			// Purely for fun
			if(!disabled) {
				try {
					await channel.client.Gyms.update(
						{ timesPinged: gym.timesPinged ? gym.timesPinged + 1 : 1 },
						{ where : {
							gymName: channel_gym,
							guildId: channel.guild.id,
						} },
					);
				}
				catch (e) {
					console.log(`Error incrementing for gym ${channel_gym}`, e);
				}
			}

			const userGyms = await channel.client.userGyms.findAll({
				where: {
					gymId: gym.id,
				},
			});

			// Check if anyone is registered for this gym
			if(userGyms.length == 0) return console.log(`No users for ${channel_gym}.`);

			// Here we start dealing with building up the mention list
			// Go through the fetched userGyms
			// Fetch timezone from the guild settings
			// If nothing is set, alert people and abort
			// With timezone, grab current date and check if between start and end
			// Next check if egg level or pokemon matches selection
			const config = await channel.client.Guilds.findOne(
				{ where: { guildId: channel.guild.id } }
			);
			const timezone = config.timezone;

			const d = new Date();
			const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
			const nd = new Date(utc + (3600000 * timezone));
			const curHour = nd.getHours();
			const curMin = nd.getMinutes();

			let userArr = [];
			userGyms.forEach(uGym => {
				// If this user+gym cobo was disabled, don't go further
				if(uGym.disabled == 1) return;

				// Grab requested start and end times
				const start = uGym.timeStart.split(':');
				const stop = uGym.timeStop.split(':');
				// check if start time is *after* "now"
				// so is start hours greater than now hours
				// or is start hours the same as now hours but start minutes is "later"
				if(start[0] > curHour || (start[0] == curHour && start[1] > curMin)) return;
				// Oposite check for stop time
				if(stop[0] < curHour || (stop[0] == curHour && stop[1] < curMin)) return;

				// So from here on, we are in a valid time slot for relevant user

				// Now, second filter, check if they have a limit of which raid levels
				const raidLevels = uGym.raidLevels.split(',');

				// channelInfo := [gym name, pokemon name ?, egg level ?]
				const channelInfo = chanName.getChanGym(channel);
				// If there are no extra info, toss it out.
				if(!channelInfo[1] && !channelInfo[2]) return;

				// If user raid level choices are not part of current raid level, abort
				if(channelInfo[2] && !raidLevels.includes(channelInfo[2])) return;

				// If there is no egg level but there is a pokemon name
				if(!channelInfo[2] && channelInfo[1]) {
					let valid = false;
					const userMons = uGym.pokemons.split(',').map(p => p.toLowerCase());

					// Loop over raidMons to see what level we have
					for(const [key, value] of Object.entries(raidMons)) {
						const lValue = value.map(v => v.toLowerCase());

						// If the raid level matches the user's list, and the pokemon is found inside it
						if(raidLevels.includes(key) && lValue.includes(channelInfo[1].toLowerCase())) {
							// If the user has no pokemon list, or if the list includes this pokemon
							if(userMons.length == 0 || userMons.includes(channelInfo[1].toLowerCase())) {
								valid = true;
								break;
							}
						}
					}
					// If we finished the loop and found nothing
					if(!valid) return;
				}
				// All checks have passed, add user to mention list.
				userArr.push(uGym.userId);
			});

			if(author_id) userArr = userArr.filter(id => id != author_id).map(id => `<@${id}>`);
			else userArr = userArr.map(id => `<@${id}>`);

			// If there are no users for this gym, stop
			if(userArr.length < 1) return console.log(`No users to ping for ${channel_gym}.`);

			// Since this has the potential to be a massive message, tell
			// djs to split the message at ~1900 characters and split by the
			// comma character which will be in between each mention.
			const final_return = `🔔🔔🔔 ${userArr.join(',')} 🔔🔔🔔\nIf you wish to no longer be notified for this gym, please use the \`disable\` or \`remove\` command.`;

			const return_array = [final_return, channel_gym, disabled];
			resolve(return_array);
		});
	},
};
