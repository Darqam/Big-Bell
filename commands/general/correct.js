const { Command } = require('discord-akairo');

class ChangeCommand extends Command {
	constructor() {
		super('change', {
			aliases: ['correct', 'fix'],
			category: 'general',
			description: {
				content: 'Allows to edit which gym is recognized by Victreebel.',
				usage: '',
			},
			channelRestriction: 'guild',
		});
	}

	exec(message) {
		return message.channel.send('Pong!').then(sent => {
			const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);
			const text = `🔂\u2000**RTT**: ${timeDiff} ms\n💟\u2000**Heartbeat**: ${Math.round(sent.client.ws.ping)} ms`;
			return sent.edit(`Pong!\n${text}`);
		});
	}
}

module.exports = ChangeCommand;
