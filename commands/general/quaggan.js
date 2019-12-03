const { Command } = require('discord-akairo');
const fetch = require('node-fetch');

class QuagganCommand extends Command {
	constructor() {
		super('quaggan', {
			aliases: ['quaggan', 'coo'],
			category: 'general',
			description: {
				content: 'Coo!',
				usage: '',
			},
		});
	}

	exec(message) {
		return fetch('https://api.guildwars2.com/v2/quaggans')
			.then(res => res.json())
			.then(json => {
				return message.channel.send(`Coo!\nhttps://static.staticwars.com/quaggans/${json[Math.floor(Math.random() * json.length)]}.jpg`);
			});
	}
}

module.exports = QuagganCommand;
