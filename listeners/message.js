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
		const date = new Date();
		const hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
		const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
		const seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
		const timestamp = `[${hours}:${minutes}:${seconds}]-${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

		console.log(`${timestamp}: <@${message.author.id}> => ${message.content}`);

		return false;
	}
}

module.exports = MessageListener;
