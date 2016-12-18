const DiscoverService = require('./broadlinkService');

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