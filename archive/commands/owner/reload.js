const { Command } = require('discord-akairo');

class ReloadCommand extends Command {
	constructor() {
		super('reload', {
			aliases: ['reload'],
			category: 'owner',
			ownerOnly: true,
			quoted: false,
			args: [
				{
					'id': 'type',
					'match': 'prefix',
					'prefix': ['type:'],
					'type': [['command', 'c'], ['inhibitor', 'i'], ['listener', 'l']],
					'default': 'command',
				},
				{
					id: 'module',
					type: (phrase, message, { type }) => {
						if (!phrase) return null;
						const resolver = this.handler.resolver.type({
							command: 'commandAlias',
							inhibitor: 'inhibitor',
							listener: 'listener',
						}[type]);

						return resolver(phrase);
					},
				},
			],
			description: {
				content: 'Reloads a module.',
				usage: '<module> [type:]',
			},
		});
	}

	exec(message, { type, module: mod }) {
		if (!mod) {
			return message.reply(`Invalid ${type} ${type === 'command' ? 'alias' : 'ID'} specified to reload.`);
		}

		try {
			mod.reload();
			return message.reply(`Sucessfully reloaded ${type} \`${mod.id}\`.`);
		}
		catch (err) {
			console.error(`Error occured reloading ${type} ${mod.id}`);
			console.log(err);
			return message.reply(`Failed to reload ${type} \`${mod.id}\`.`);
		}
	}
}

module.exports = ReloadCommand;
