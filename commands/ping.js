const { Command } = require('discord-akairo');

class PingCommand extends Command {
	constructor() {
		super('ping', {
			aliases: ['ping'],
		});
	}

	exec(message) {
		return message.channel.send('Pong!').then(sent => {
			const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);
			const text = `🔂\u2000**RTT**: ${timeDiff} ms\n💟\u2000**Heartbeat**: ${Math.round(sent.client.ping)} ms`;
			return sent.edit(`Pong!\n${text}`);
		});
	}
}

module.exports = PingCommand;
