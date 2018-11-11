const { AkairoClient } = require('discord-akairo');
const config = require('./config.json');
const Sequelize = require('sequelize');

const client = new AkairoClient({
	ownerID: '129714945238630400',
	prefix: config.prefix,
	commandDirectory: './commands/',
	inhibitorDirectory: './inhibitors/',
	listenerDirectory: './listeners/',
}, {
	disableEveryone: true,
});

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
