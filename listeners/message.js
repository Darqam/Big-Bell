const { Listener } = require('discord-akairo');

class MessageListener extends Listener {
	constructor() {
		super('message', {
			emitter: 'client',
			event: 'message',
		});
	}

	exec(message) {
		if(!message.content.startsWith(this.client.commandHandler.prefix)) return;

		console.log(`Command ran: <@${message.author.id}> => ${message.content}`);

		return false;
	}
}

module.exports = MessageListener;
