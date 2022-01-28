const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const Sequelize = require('sequelize');

// Create a new client instance
// Guilds: channel updates, creates, deletes
// guild_messages: old command styles, map updates
// dm: dm...
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES
] });


const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// operatorsAliases: false,
	// SQLite only
	storage: 'database.sqlite',
});

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Create our commands collection
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command)
}

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


const guilds = sequelize.define('guilds', {
	guildId: {
		type: Sequelize.STRING,
		unique: true,
	},
	timezone: Sequelize.STRING,
	prefixes: Sequelize.STRING,
});

client.Guilds = guilds;

client.Gyms = sequelize.define('gyms', {
	gymName: Sequelize.TEXT,
	guildId: Sequelize.TEXT,
	timesPinged: Sequelize.INTEGER,
	gymMap: Sequelize.TEXT,
	gymDirections: Sequelize.TEXT,
	exRaidNumber: Sequelize.INTEGER,
	exRaidEligibility: Sequelize.TEXT,
});

client.UserGyms = sequelize.define('userGyms', {
	userId: Sequelize.STRING,
	gymId: Sequelize.STRING,
	gymName: Sequelize.TEXT,
	timeStart: Sequelize.STRING,
	timeStop: Sequelize.STRING,
	disabled: Sequelize.INTEGER, // 1 or 0
	raidLevels: Sequelize.STRING, // "2,4,5"
	pokemons: Sequelize.TEXT,
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
	guildId: Sequelize.STRING,
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

client.Pokestops = sequelize.define('pokestops', {
	stopName: Sequelize.TEXT,
	guildId: Sequelize.TEXT,
	coordinates: Sequelize.TEXT,
	stopMap: Sequelize.TEXT,
	stopDirections: Sequelize.TEXT,
});

client.RocketLeaders = sequelize.define('rocketLeaders', {
	guildId: Sequelize.TEXT,
	messageURL: Sequelize.STRING,
	stopId: Sequelize.TEXT,
	stopCoordinates: Sequelize.TEXT,
	stopName: Sequelize.TEXT,
	leaderName: Sequelize.TEXT,
	leaderLineup: Sequelize.TEXT,
	spawnDate: Sequelize.STRING,
});

client.PvPSeason = sequelize.define('PvPSeason', {
	seasonId: Sequelize.INTEGER,
	guildId: Sequelize.TEXT,
	leaderboardMessageId: Sequelize.TEXT,
	leaderboardChannelId: Sequelize.TEXT,
	seasonActive: Sequelize.BOOLEAN,
	seasonStart: Sequelize.TEXT,
	seasonEnd: Sequelize.TEXT,
});

client.MMR = sequelize.define('mmr', {
	guildId: Sequelize.TEXT,
	userId: Sequelize.TEXT,
	seasonId: Sequelize.INTEGER,
	mmrValue: Sequelize.INTEGER,
	userHistory: Sequelize.TEXT,
	lastUpdate: Sequelize.TEXT,
});

client.Memory = sequelize.define('memory', {
	timestamp: {
		type: Sequelize.DOUBLE,
		unique: true,
	},
	memory: Sequelize.DOUBLE,
	botUptime: Sequelize.DOUBLE,
	processUptime: Sequelize.DOUBLE,
});

client.MyEmojiIds = {
	'failure': '511174899969032193',
	'success': '511174612323663874',
	'question': '❓',
};


client.login(config.token);
