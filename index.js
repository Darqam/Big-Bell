const { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } = require('discord-akairo');
const config = require('./config.json');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	operatorsAliases: false,
	// SQLite only
	storage: 'database.sqlite',
});

const guilds = sequelize.define('guilds', {
	guildId: {
		type: Sequelize.STRING,
		unique: true,
	},
	timezone: Sequelize.STRING,
	prefixes: Sequelize.STRING,
});

class MyClient extends AkairoClient {
	constructor() {
		super({
			ownerID: '129714945238630400',
		}, {
			disableEveryone: true,
		});

		this.commandHandler = new CommandHandler(this, {
			directory: './commands/',
			prefix: async msg => {
				if(!msg.guild) return 'bb!';

				const guildConfigs = await guilds.findOne({
					where: {
						guildId: msg.guild.id,
					},
				});
				if(!guildConfigs) return 'bb!';
				return guildConfigs.prefixes.split(',');
			},
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

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

client.Guilds = guilds;

client.Gyms = sequelize.define('gyms', {
	gymName: Sequelize.TEXT,
	guildIds: Sequelize.TEXT,
	timesPinged: Sequelize.INTEGER,
	gymMap: Sequelize.TEXT,
	gymDirections: Sequelize.TEXT,
	exRaidNumber: Sequelize.INTEGER,
	exRaidEligibility: Sequelize.TEXT,
});

client.userGyms = sequelize.define('userGyms', {
	userId: Sequelize.STRING,
	gymId: Sequelize.STRING,
	gymName: Sequelize.TEXT,
	timeStart: Sequelize.STRING,
	timeStop: Sequelize.STRING,
	disabled: Sequelize.INTEGER, // 1 or 0
	raidLevels: Sequelize.STRING, // "2,4,5"
	pokemons: Sequelize.TEXT,
});

// timestamp will be in ms for ease of use
client.Stats = sequelize.define('stats', {
	timestamp: {
		type: Sequelize.STRING,
		unique: true,
	},
	gymName: Sequelize.STRING,
	pokemon: Sequelize.STRING,
});

client.LiveRaids = sequelize.define('liveRaids', {
	guildId: Sequelize.STRING,
	channelId: Sequelize.STRING,
	isEgg: Sequelize.BOOLEAN,
	isExpired: Sequelize.BOOLEAN,
	level: Sequelize.INTEGER,
	name: Sequelize.STRING,
	pokemon: Sequelize.STRING,
	coordinates: Sequelize.STRING,
	timeEnd: Sequelize.INTEGER,
	timeHatch: Sequelize.INTEGER,
});

client.myEmojiIds = {
	'failure': '511174899969032193',
	'success': '511174612323663874',
	'question': '❓',
};

client.login(config.token);
