const { Command } = require('discord-akairo');
const GoogleSpreadsheet = require('google-spreadsheet');
const util = require('util');
const creds = require('../../saskPokemonGym-5a6d9b796bde.json');

class StatsCommand extends Command {
	constructor() {
		super('populate', {
			aliases: ['populate'],
			category: 'mod',
			description: {
				content: 'Will populate the gym database.',
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
		const sheet_position = 6;
		let sheet;
		message.channel.startTyping();
		const gymList = await this.client.Gyms.findAll({ where: { guildId: message.channel.guild.id } });
		if(!gymList) return message.channel.send('Could not query database. Aborting.');

		const new_gyms = [];

		const updated_maps = [];
		const updated_directions = [];
		const updated_ex_raid_number = [];
		const updated_ex_raid_elig = [];

		// Create a document object using the ID of the spreadsheet - obtained from its URL.
		// const doc = new GoogleSpreadsheet('1k6Gt4J323JnEB3oud_vK8gGyELoC0jha4etYXvFSbAk');
		// My copy with a few more gyms, until the main one gets updated.
		const doc = new GoogleSpreadsheet('1WgNar6otRmRi_ZduBj0H__gV9Qa85bJ1VJpmtK3Puqs');

		const auth = util.promisify(doc.useServiceAccountAuth);
		const gInfo = util.promisify(doc.getInfo);

		// Authenticate with the Google Spreadsheets API.
		await auth(creds);
		gInfo((err, info) => {
			console.log(`Loaded doc: ${info.title} by ${info.author.email}`);
			sheet = info.worksheets[sheet_position];
			console.log(`sheet 6: ${sheet.title} ${sheet.rowCount}x${sheet.colCount}`);

			message.channel.stopTyping();

			sheet.getRows({
				offset: 1,
				orderby: 'col2',
			}, async function(err, rows) {
				if(!rows) return message.reply('Couldn\'t load any rows from that sheet.');
				rows.forEach(row => {
					// row properties of interest
					// gymname, exraideligibility, mapsurl, directionsurl, ofex
					const local_gym = gymList.find(gym => gym.gymName == row.gymname.toLowerCase());
					if(local_gym) {
						// console.log(`Found local copy of gym for ${row.gymname}`);
						if(local_gym.gymMap != row.mapsurl) {
							updated_maps.push(row);
						}
						if(local_gym.gymDirections != row.directionsurl) {
							updated_directions.push(row);
						}
						if(local_gym.exRaidNumber != row.ofex) {
							updated_ex_raid_number.push(row);
						}
						if(local_gym.exRaidEligibility != row.exraideligibility) {
							updated_ex_raid_elig.push(row);
						}
					}
					else {
						new_gyms.push(row);
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

					// check mark, and X mark
					await msg.react(msg.client.myEmojiIds.success);
					await msg.react(msg.client.myEmojiIds.failure);
					const valid_emojis = [msg.client.myEmojiIds.success, msg.client.myEmojiIds.failure];

					const react_filter = (reaction, user) => {
						return valid_emojis.includes(reaction.emoji.id) && !user.bot && user.id == message.author.id;
					};
					try {
						const collected = await msg.awaitReactions(react_filter, { max: 1, time: 60000, errors: ['time'] });
						const reaction = collected.first();

						if(reaction.emoji.id == msg.client.myEmojiIds.success) {
							const success = [];
							const error = [];
							// If it's the check mark
							for(let i = 0; i < new_gyms.length; i++) {
								try {
									const gym = await message.client.Gyms.create({
										gymName: new_gyms[i].gymname.toLowerCase().trim(),
										guildId: message.guild.id,
										timesPinged: 0,
										gymMap: new_gyms[i].mapsurl,
										gymDirections: new_gyms[i].directionsurl,
										exRaidNumber: new_gyms[i].ofex,
										exRaidEligibility: new_gyms[i].exraideligibility,
									});
									success.push(gym.gymName);
								}
								catch (e) {
									console.log(e);
									error.push(new_gyms[i].gymname);
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
							message.channel.send(output, {
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
						if(reaction.emoji.id == msg.client.myEmojiIds.failure) {
							return message.channel.send('Got it, aborting.');
						}
					}
					catch(e) {
						return message.channel.send('Did not get input within a minute, aborting.');
					}
				}
				// End of "if there are new gyms"
				if(new_gyms.length == 0) {
					message.channel.send('There were no new gyms found.');
				}
				if(gymList.length < rows.length - 1) {
					message.channel.send('Deleted gym?');
				}
				let updateOut = '';
				const updateObj = {};
				if(updated_maps.length > 0) {
					updateOut += `maps need updating (${updated_maps.length}).\n`;
				}
				if(updated_directions.length > 0) {
					updateOut += 'directions need updating.\n';
				}
				if(updated_ex_raid_number.length > 0) {
					updateOut += `EX Raid numbers to update (${updated_ex_raid_number.length}):\n\`\`\``;
					for(const sheetGym of updated_ex_raid_number) {
						const curGym = gymList.find(g => g.gymName.toLowerCase() == sheetGym.gymname.toLowerCase());
						if(!updateObj[curGym.id]) updateObj[curGym.id] = {};

						updateObj[curGym.id].exRaidNumber = sheetGym.ofex;
						updateOut += `${curGym.gymName}: ${curGym.exRaidNumber} -> ${sheetGym.ofex}\n`;
					}
					updateOut += '```\n';
				}
				if(updated_ex_raid_elig.length > 0) {
					updateOut += `EX Raid eligibility to update (${updated_ex_raid_elig.length}).\n\`\`\``;
					for(const sheetGym of updated_ex_raid_elig) {
						const curGym = gymList.find(g => g.gymName.toLowerCase() == sheetGym.gymname.toLowerCase());
						if(!updateObj[curGym.id]) updateObj[curGym.id] = {};

						updateObj[curGym.id].exRaidEligibility = sheetGym.exraideligibility;
						updateOut += `${curGym.gymName}: ${curGym.exRaidNumber} -> ${sheetGym.ofex}\n`;
					}
					updateOut += '```\n';
				}

				// If there are values to update
				const success = [];
				const errors = [];
				let output = '';
				if(Object.keys(updateObj).length > 0) {
					console.log(Object.keys(updateObj).length);
					message.channel.send(updateOut, {
						split: {
							maxLength: 1900,
							char: ',',
							prepend: '```\n',
							append: ',\n```',
						},
					}).catch(e => {
						console.log('Error sending updateOut', e);
					});

					for(const [key, value] of Object.entries(updateObj)) {
						const curGym = gymList.find(g => g.id == key);
						const affectedRows = await message.client.Gyms.update(value,
							{ where : {	id: key }	}
						);

						if(affectedRows > 0) {
							success.push(curGym.gymName);
						}
						else {
							errors.push(curGym.gymName);
						}
					}
					if(success.length > 0) {
						output += `Successfully updated ${success.length} instances for: \n\`\`\`\n${success.join(',')}\`\`\`\n`;
					}

					if(errors.length > 0) {
						output += `Could not create the gym instance for the following names: \n\`\`\`\n${errors.join(',')}\`\`\``;
					}
					if(output) {
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
				}
				return message.channel.send('There were no updates to perform.');
			});
		}).catch(err => {
			console.log('Error in populate.', err);
		});
	}
}

module.exports = StatsCommand;
