const { Command } = require('discord-akairo');
const fs = require('fs');
const fetch = require('node-fetch');

class StopAddCommand extends Command {
	constructor() {
		super('gymAdd', {
			aliases: ['gym', 'addGym'],
			split: 'quoted',
			category: 'mod',
			description: {
				content: 'Adds gyms to the db',
				usage: '',
			},
			args: [
				{
					id: 'link',
					type: 'lowercase',
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
		if(!args.link) return message.channel.send('Need message link, k?');
		const dup = [];
		const err = [];
		const suc = [];
		let name;
		let linkMsg;

		if(args.link.startsWith('http')) {
			const linkArr = args.link.split('/');
			const messageId = linkArr[linkArr.length - 1];
			const channelId = linkArr[linkArr.length - 2];

			if(message.client.channels.cache.has(channelId)) {
				try {
					linkMsg = await message.client.channels.cache.get(channelId).messages.fetch(messageId);
				}
				catch(e) {
					console.log(e);
					return message.channel.send('Could not fetch message.');
				}
			}
			else {
				return message.channel.send('I can\'t see that channel?');
			}
		}
		else {
			try {
				linkMsg = await message.channel.messages.fetch(args.link);
			}
			catch(e) {
				console.log(e);
				return message.channel.send('Could not fetch message.');
			}
		}

		// At this point we either returned or have a message object wanted
		// Since we can't read the csv directly, grab it and download
		await fetch(linkMsg.attachments.first().attachment)
			.then(res => {
				const dest = fs.createWriteStream('./temp_gym_list.csv');
				res.body.pipe(dest);
			}).catch(e => {
				console.log(e);
				return message.channel.send('Errored on file fetch.');
			});

		const stops = await message.client.Gyms.findAll({
			where:{
				guildId:message.guild.id,
			},
		});
		const currentNames = stops.map(x => x.gymName);

		const content = fs.readFileSync('./temp_gym_list.csv', 'UTF8');
		// File structure is:
		// name, nickname, lat, lon
		const lines = content.split('\n');
		lines.shift(); // Remove header

		for(let i = 0; i < lines.length - 1; i++) {
			name = '';
			try {

				let arr = lines[i].split(',');
				// Remove the last column (custom exraid stuff)
				arr.splice(-1, 1);

				const exStatus = arr[arr.length - 1].trim();
				arr.splice(-1, 1);

				// Grab lon and remove, then lat
				const lon = arr[arr.length - 1].trim();
				arr.splice(-1, 1);
				const lat = arr[arr.length - 1].trim();
				arr.splice(-1, 1);

				// Remove nickname, don't care
				arr.splice(-1, 1);

				// Remove all empty entries
				arr = arr.filter(n => n);

				// Now merge all remaining for full name (can include comma)
				// Remove the quotation marks from some names
				name = arr.join(',').trim().replace(/"/g, '').toLowerCase();

				// If this stop already exists...
				if(currentNames.includes(name)) {
					dup.push(name);
					continue;
				}

				const coords = `${lat},${lon}`;

				await message.client.Gyms.create({
					gymName: name.toLowerCase(),
					guildId: message.guild.id,
					timesPinged: 0,
					gymMap: `https://www.google.com/maps/place/${coords}`,
					gymDirections: `https://www.google.com/maps/dir/Current+Location/${coords}`,
					exRaidNumber: 0,
					exRaidEligibility: exStatus == 'FALSE' ? 'Possible' : 'n/a',
				});
				suc.push(name);
			}
			catch (e) {
				console.log(e);
				err.push(name);
			}
		}

		let output = '';
		if(suc.length > 0 && suc.length < 20) {
			output += `Successfully created ${suc.length} instances for: \n\`\`\`\n${suc.join(',')}\`\`\`\n`;
		}
		else if(suc.length > 0) {
			output += `Successfully created ${suc.length} instances`;
		}

		if(err.length > 0) {
			output += ` Could not create the stop instance for the following names: \n\`\`\`\n${err.join(',')}\`\`\``;
		}

		if(dup.length > 0) {
			output += ` Ignored ${dup.length} gyms already existing in DB`;
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
}

module.exports = StopAddCommand;
