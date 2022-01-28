const { Listener } = require('discord-akairo');

class MessageReactionAdd extends Listener {
	constructor() {
		super('messageReactionAdd', {
			emitter: 'client',
			event: 'messageReactionAdd',
		});
	}

	exec(reaction, user) {
		const reactRemoval = ['✉'];
		const meowthId = '346759953006198784';
		if(reactRemoval.includes(reaction.emoji.name) && user.id == meowthId) {
			reaction.users.remove(meowthId);
		}
	}
}

module.exports = MessageReactionAdd;
