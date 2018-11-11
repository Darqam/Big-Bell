const { AkairoClient } = require('discord-akairo');
const config = require('./config.json');

const client = new AkairoClient({
    ownerID: '129714945238630400',
    prefix: config.prefix,
    commandDirectory: './commands/',
    inhibitorDirectory: './inhibitors/',
    listenerDirectory: './listeners/'
}, {
    disableEveryone: true
});

client.login(config.token);
