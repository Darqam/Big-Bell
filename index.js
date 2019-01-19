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
		// this.inhibitorHandler.loadAll();

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
	logging: false,
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
	submittedById: Sequelize.TEXT,
	submittedOn: Sequelize.TEXT,
	timesPinged: Sequelize.INTEGER,
	gymMap: Sequelize.TEXT,
	gymDirections: Sequelize.TEXT,
	exRaidNumber: Sequelize.INTEGER,
	exRaidEligibility: Sequelize.TEXT,
});

client.Config = sequelize.define('config', {
	guildId: {
		type: Sequelize.STRING,
		unique: true,
	},
	announcementChan: Sequelize.STRING,
});

client.Announcements = sequelize.define('announcements', {
	channelId: {
		type: Sequelize.STRING,
		unique: true,
	},
});

// timestamp will be in ms for ease of use
client.Stats = sequelize.define('stats', {
	timestamp: {
		type: Sequelize.STRING,
		unique: true,
	},
	gymName: Sequelize.STRING,
});

client.myEmojiIds = {
	'failure': '511174899969032193',
	'success': '511174612323663874',
	'question': '❓',
};

client.login(config.token);
