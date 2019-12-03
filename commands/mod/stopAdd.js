const { Command } = require('discord-akairo');
const fs = require('fs');
const fetch = require('node-fetch');

class StopAddCommand extends Command {
	constructor() {
		super('stopAdd', {
			aliases: ['stop', 'addStop'],
			split: 'quoted',
			category: 'mod',
			description: {
				content: 'Adds pokestops to the db',
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

			if(message.client.channels.has(channelId)) {
				try {
					linkMsg = await message.client.channels.get(channelId).messages.fetch(messageId);
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

		await fetch(linkMsg.attachments.first().attachment)
			.then(res => {
				const dest = fs.createWriteStream('./temp_stops_list.csv');
				res.body.pipe(dest);
			}).catch(e => {
				console.log(e);
				return message.channel.send('Errored on file fetch.');
			});

		const stops = await message.client.pokestops.findAll();
		const currentNames = stops.map(x => x.stopName);

		const content = fs.readFileSync('./temp_stops_list.csv', 'UTF8');
		// File structure is:
		// name, nickname, lat, lon
		const lines = content.split('\n');
		lines.shift(); // Remove header

		for(let i = 0; i < lines.length - 1; i++) {
			name = '';
			try {

				const arr = lines[i].split(',');

				// Grab lon and remove, then lat
				const lon = arr[arr.length - 1].trim();
				arr.splice(-1, 1);
				const lat = arr[arr.length - 1].trim();
				arr.splice(-1, 1);

				// Remove nickname, don't care
				arr.splice(-1, 1);

				// Now merge all remaining for full name (can include comma)
				// Remove the quotation marks from some names
				name = arr.join(',').trim().replace(/"/g, '');

				// If this stop already exists...
				if(currentNames.includes(name)) {
					dup.push(name);
					continue;
				}

				const coords = `${lat},${lon}`;

				await message.client.pokestops.create({
					stopName: name,
					guildId: message.guild.id,
					coordinates: coords,
					stopMap: `https://www.google.com/maps/place/${coords}`,
					stopDirections: `https://www.google.com/maps/dir/Current+Location/${coords}`,
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
			output += ` Ignored ${dup.length} stops already existing in DB`;
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

		// const stop_list = content.split(';');
		/*
		const success = [];
		const error = [];
		for(let i = 0; i < stop_list.length; i++) {
			const stop_info = stop_list[i].split(',');
			let coords = '';
			if(stop_info[0]) {
				stop_info[0] = stop_info[0].trim();
				coords = `${stop_info[1].trim()}, ${stop_info[2].trim()}`;
			}
			if(stop_info[0]) stop_info[0] = stop_info[0].trim();
			if(!stop_info[0] || !coords) {
				error.push(stop_info[0]);
				continue;
			}
			try {
				await message.client.pokestops.create({
					stopName: stop_info[0].toLowerCase().trim(),
					guildId: message.guild.id,
					coordinates: coords,
					stopMap: `https://www.google.com/maps/place/${coords}`,
					stopDirections: `https://www.google.com/maps/dir/Current+Location/${coords}`,
				});
				success.push(stop_info[0]);
			}
			catch (e) {
				console.log(e);
				error.push(stop_info[0]);
			}
		}
		let output = '';
		if(success.length > 0) {
			output += `Successfully created ${success.length} instances for: \n\`\`\`\n${success.join(',')}\`\`\`\n`;
		}

		if(error.length > 0) {
			output += `Could not create the stop instance for the following names: \n\`\`\`\n${error.join(',')}\`\`\``;
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
		*/
	}
}

module.exports = StopAddCommand;
