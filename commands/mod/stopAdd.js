const { Command } = require('discord-akairo');
// const fs = require('fs');

class StopAddCommand extends Command {
	constructor() {
		super('stopAdd', {
			aliases: ['stop'],
			category: 'mod',
			description: {
				content: 'Adds pokestops to the db',
				usage: '',
			},
			args: [
				{
					id: 'stop_list',
					match: 'content',
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
		if(!args.stop_list) return message.reply('No stops found in query');
		// const content = fs.readFileSync('stops.txt', 'UTF8');

		const stop_list = args.stop_list.split(';');
		// const stop_list = content.split(';');
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
	}
}

module.exports = StopAddCommand;
