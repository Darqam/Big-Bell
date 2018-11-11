const { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } = require('discord-akairo');
const config = require('./config.json');
const Sequelize = require('sequelize');

class MyClient extends AkairoClient {
	constructor() {
		super({
			ownerID: '129714945238630400',
		}, {
			disableEveryone: true,
		});

		this.commandHandler = new CommandHandler(this, {
			directory: './commands/',
			prefix: config.prefix,
		});
		this.commandHandler.loadAll();

		this.inhibitorHandler = new InhibitorHandler(this, {
			directory: './inhibitors/',
		});

		this.listenerHandler = new ListenerHandler(this, {
			directory: './listeners/',
		});
		this.listenerHandler.loadAll();
	}
}

const client = new MyClient();

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	operatorsAliases: false,
	// SQLite only
	storage: 'database.sqlite',
});

client.Gyms = sequelize.define('gyms', {
	GymName: {
		type: Sequelize.STRING,
		unique: true,
	},
	userIds: Sequelize.TEXT,
	submittedByTag: Sequelize.TEXT,
	submittedById: Sequelize.TEXT,
	submittedOn: Sequelize.TEXT,
	timesPinged: Sequelize.INTEGER,
});

client.login(config.token);
