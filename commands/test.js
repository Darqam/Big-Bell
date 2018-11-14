const { Command } = require('discord-akairo');
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const creds = require('../saskPokemonGym-5a6d9b796bde.json');

class StatsCommand extends Command {
	constructor() {
		super('test', {
			aliases: ['test'],
			description: 'testing',
			userPermissions: ['MANAGE_GUILD'],
		});
	}

	async exec(message) {
		const sheet_position = 6;
		let sheet;

		const gymList = await this.client.Gyms.findAll({ attributes: ['GymName', 'gymMap', 'gymDirections', 'exRaidNumber', 'exRaidEligibility'] });
		if(!gymList) return message.channel.send('Could not query database. Aborting.');

		const new_gyms = [];
		const old_gyms = [];

		const updated_maps = [];
		const updated_directions = [];
		const updated_ex_raid_number = [];
		const updated_ex_raid_elig = [];


		// Create a document object using the ID of the spreadsheet - obtained from its URL.
		const doc = new GoogleSpreadsheet('1k6Gt4J323JnEB3oud_vK8gGyELoC0jha4etYXvFSbAk');

		// Authenticate with the Google Spreadsheets API.
		async.series([
			function setAuth(step) {
				// see notes below for authentication instructions!

				doc.useServiceAccountAuth(creds, step);
			},
			function getInfoAndWorksheets(step) {
				doc.getInfo(function(err, info) {
					console.log(`Loaded doc: ${info.title} by ${info.author.email}`);
					sheet = info.worksheets[sheet_position];
					console.log(`sheet 6: ${sheet.title} ${sheet.rowCount}x${sheet.colCount}`);
					step();
				});
			},
			function workingWithRows(step) {
				// google provides some query options
				sheet.getRows({
					offset: 1,
					orderby: 'col2',
				}, async function(err, rows) {
					if(!rows) return message.reply('Couldn\'t load any rows from that sheet.');
					rows.forEach(async row => {
						// console.log(row);
						// row properties of interest
						// gymname, exraideligibility, mapsurl, directionsurl, ofex
						const local_gym = gymList.find(gym => gym.GymName == row.gymname.toLowerCase());
						if(local_gym) {
							//console.log(`Found local copy of gym for ${row.gymname}`);
							if(local_gym.gymMap != row.mapsurl){

							}
							if(local_gym.gymDirections != row.directionsurl){

							}
							if(local_gym.exRaidNumber != row.ofex){

							}
							if(local_gym.exRaidEligibility != row.exraideligibility){

							}
						}
						else {
							new_gyms.push(row);
							// console.log(`Nope for ${row.gymname}`);
						}
					});
					console.log(`Read ${rows.length} rows`);

					if(new_gyms.length > 0) {
						// We have some new gyms that weren't in the database before
						let msg = await message.channel.send(`I found ${new_gyms.length} new gyms. Would you like to add the following gyms to the database?\n\`\`\`\n${new_gyms.map(g => g.gymname).join(', ')}\n\`\`\``, {
							split: {
								maxLength: 1900,
								char: ',',
								prepend: '```\n',
								append: ',\n```',
							},
						});
						if(Array.isArray(msg)) msg = msg[msg.length - 1];

						await msg.react('511174612323663874'); // check
						await msg.react('511174899969032193'); // cross/X
						const valid_emojis = ['511174612323663874', '511174899969032193'];

						const react_filter = (reaction, user) => {
							return valid_emojis.includes(reaction.emoji.id) && !user.bot && user.id == message.author.id;
						};
						try {
							const collected = await msg.awaitReactions(react_filter, { max: 1, time: 60000, errors: ['time'] });
							const reaction = collected.first();

							if(reaction.emoji.id == '511174612323663874') {
								const success = [];
								const error = [];
								// If it's the check mark
								for(let i = 0; i < new_gyms.length; i++) {
									const date = new Date();
									try {
										const gym = await message.client.Gyms.create({
											GymName: new_gyms[i].gymname.toLowerCase().trim(),
											userIds: '',
											submittedById: message.author.id,
											submittedOn: date.toString(),
											timesPinged: 0,
											gymMap: new_gyms[i].mapsurl,
											gymDirections: new_gyms[i].directionsurl,
											exRaidNumber: new_gyms[i].ofex,
											exRaidEligibility: new_gyms[i].exraideligibility,
										});
										success.push(gym.GymName);
									}
									catch (e) {
										console.log(e);
										error.push(new_gyms[i]);
									}
								}
								// End of for loop over new gyms
								let output = '';
								if(success.length > 0) {
									output += `Successfully created ${success.length} instances for: \n\`\`\`\n${success.join(',')}\`\`\`\n`;
								}

								if(error.length > 0) {
									output += `Could not create the gym instance for the following names: \n\`\`\`\n${error.join(',')}\`\`\``;
								}
								return message.channel.send(output, {
									split: {
										maxLength: 1900,
										char: ',',
										prepend: '```\n',
										append: ',\n```',
									},
								}).catch(e => {
									console.log('Error sending final status', e);
								});
							}
							if(reaction.emoji.id == '511174899969032193') {
								return message.channel.send('Got it, aborting.');
							}

						}
						catch(e) {
							return message.channel.send('Did not get input within a minute, aborting.');
						}
					}
					// End of "if there are new gyms"
					if(new_gyms.length == 0) {
						return message.channel.send('There were no new gyms found.');
					}
					step();
				});
			},
		], function(err) {
			if(err) {
				console.log(`Error: ${err}`);
			}
		});
	}
}

module.exports = StatsCommand;
