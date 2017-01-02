const DiscoverService = require('./broadlinkService');
var repl = require("repl");


var replServer = repl.start({
	prompt: "home-auto > ",
});




var server = new DiscoverService()
console.log(JSON.stringify(server))
server.on("devicesFound",function(devices){
	console.log('Devices Found: '+Object.keys(devices).length)

	if(Object.keys(devices).length){
		devs = devices
		//console.log(devices);
		//var device1 = devices[0].check_temperature();
	}
})

replServer.context.server = server;
/*
try{



	var server = new DiscoverService()
	console.log(JSON.stringify(server))
	server.on("devicesFound",function(devices){
		console.log('Devices Found: '+Object.keys(devices).length)

		if(Object.keys(devices).length){
			//console.log(devices);
			//var device1 = devices[0].check_temperature();
		}
	})

	server.start();


}catch(e){
	console.log(e)
}
	*/