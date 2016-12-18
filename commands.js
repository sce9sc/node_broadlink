var EventEmitter = require('events');

class DeviceCommands {
	constructor(){
		this.devices ={}
		
	}
	
	addDevice(params){
		if(this.devices[params.name]==undefined){
			this.devices[params.name] = {
					description:"",
					commands:{},
					model:{},
					other:{},
				}	
			
		}else{
			console.log("device already exists")
		}
	}
		
	addDeviceDescription(params){
		if(this.devices[param.name]!=undefined){
			this.devices[param.name].description = params.description;
		}else{
			console.log('no device found inorder to update description')
		}
		
	}
	
	addDeviceCommand(){
		if(this.devices[param.name]!=undefined){
			if(this.devices[param.name].commands[params.command]==undefined){
				this.devices[param.name].commands[params.command] = "";
			}else{
				console.log('cannot add device command , already exists')
			}
			
		}else{
			console.log('no device found inorder to update description')
		}
	}
	
	removeDevice(){
		
	}
	
	
	
}


module.exports = DeviceCommands


/*
var fakeCommands = {
			devices:{
				"TV":{
					description:"TV living room",
					commands:{
						"ON":"",
						"OFF":"",
						"VOLUME_UP":"",
						"VOLUME_DOWN":"",
						"CHANNEL_UP":"",
						"CHANNEL_DOWN":"",
						"CHANNEL_DOWN":"",
					},
					model:"SONY",
					other:{}
				}
			}
		}

*/