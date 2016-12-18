var dgram = require('dgram'); 
var server = dgram.createSocket("udp4"); 
var crypto = require('crypto');
var moment = require('moment');
var EventEmitter = require('events');
var PouchDB = require('pouchdb');


var Devices = require('./devices');
var RM = Devices.RM
var Device = Devices.Device



class DiscoverService extends EventEmitter{
	constructor(port,broadcastAddr){
		super();
		this.db = PouchDB('broadlinkDb');
		this.PORT = port ||80;
		this.BROADCAST_ADDR = broadcastAddr || "255.255.255.255";
		this.server = null; 
		
		//this.getDevicesFromDB();
		this.devices = {}
		//this.createDevicesFromStore()
		
	}
	
	createDevicesFromStore(){
		var devices = {}
		var storedDevices = this.getDevicesFromDB()
		if(storedDevices!=null){
			var devicesKeys = Object.keys(storedDevices.devices)
			for(var i=0;i<devicesKeys.length;i++){
				if(storedDevices[devicesKeys[i]].type == "RM"){
					devices[devicesKeys[i]] = new RM(storedDevices[devicesKeys[i]])
				}else{
					devices[devicesKeys[i]] = new Device(storedDevices[devicesKeys[i]])
				}
			}
			
			this.devices = devices;
		}
		
		
	}

	start(){
		if(this.server==null){
			this.server = dgram.createSocket("udp4"); 
			this.server.bind(()=>{
				this.serverAddress = this.server.address();
				console.log(this.serverAddress );
				this.server.setBroadcast(true);
			});

			this.server.on('listening', () =>{this.onlistening()});
			this.server.on('message', (message, rinfo)=>{this.onmessage(message,rinfo)});
			this.server.on('close',()=>{this.server=null})
		}
	}
	
	onmessage(message, rinfo) {
			
		    //console.log('Message from: ' + rinfo.address + ':' + rinfo.port + ' - ' + message);
		    console.log("Device Found "+ rinfo.address )
		    console.log(message)
		    console.log(rinfo);
			if(this.devices[rinfo.address]!=undefined){ // if device exist in devices then call the onmessage of the specific device;
				this.devices[rinfo.address].onmessage(message, rinfo)
			}else{
				this.createDevice(message, rinfo)
			}
	}

	onlistening(){
		this.serverAddress = this.server.address();
	    console.log('UDP Client listening on ' + this.serverAddress.address + ":" + this.serverAddress.port);
	    this.discover();
	}

	discover(timeout){
		var ttlserver = timeout || 300;
		var date = moment()
		var address = this.serverAddress.address.split('.');
		var port = this.serverAddress.port
		var packet= new Array(48);
		/*packet[0]=0x0;
		packet[1]=0x0;
		packet[2]=0x0;
		packet[3]=0x0;
		packet[4]=0x0;
		packet[5]=0x0;
		packet[6]=0x0;
		packet[7]=0x0;*/

		packet[8]=0x02; // timezone		Current offset from GMT as a little-endian 32 bit integer
		// packet[9]=0x0; 
		// packet[10]=0x0; 
		// packet[11]=0x0; 

		packet[12]=date.year() & 0xff; //Current year as a little-endian 16 bit integer
		packet[13]=date.year() >> 8; 

		packet[14]=date.minutes()  // Current number of minutes past the hour

		packet[15]=date.hour(); //Current number of hours past midnight

		packet[16]=parseInt(date.year().toString().slice(2)); //Current number of years past the century

		packet[17]=date.day(); //Current day of the week (Monday = 0, Tuesday = 1, etc)

		packet[18]=date.date(); //Current day in month

		packet[19]=date.month(); //Current month

		// packet[20]=0x0;
		// packet[21]=0x0;
		// packet[22]=0x0;
		// packet[23]=0x0;

		packet[24]=address[0]; //ip address
		packet[25]=address[1];	//ip address
		packet[26]=address[2];	//ip address
		packet[27]=address[3];	//ip address

		packet[28]=port & 0xff; //Source port as a little-endian 16 bit integer
		packet[29]=port >> 8;

		// packet[30]=0x0;
		// packet[31]=0x0;

		//packet[32]=0x0; //Checksum as a little-endian 16 bit integer
		//packet[33]=0x0;

		// packet[34]=0x0;
		// packet[35]=0x0;
		// packet[36]=0x0;
		// packet[37]=0x0;
		packet[38]=0x06; //6
		
		// packet[39]=0x0;
		// packet[40]=0x0;
		// packet[41]=0x0;
		// packet[42]=0x0;
		// packet[43]=0x0;
		// packet[44]=0x0;
		// packet[45]=0x0;
		// packet[46]=0x0;
		// packet[47]=0x0;

		var checksum = 0xbeaf

		for(var i=0;i<packet.length;i++){
	    	checksum += packet[i]
		}
		checksum = checksum & 0xffff
		packet[32] = checksum & 0xff //Checksum as a little-endian 16 bit integer
		packet[33] = checksum >> 8  //Checksum as a little-endian 16 bit integer

		var buffPacket = new Buffer(packet);

		this.server.send(buffPacket, 0, buffPacket.length, this.PORT, this.BROADCAST_ADDR, function() {
        	console.log("Sent buffPacket");
        	console.log(buffPacket);
    	});
		
		setTimeout(()=>{
			this.server.close();
			this.emit('devicesFound',this.devices);
			//this.saveDevicesToDB(this.devices)
			
		},ttlserver);
		
		
	}
	
	getDevicesFromDB(){
		this.db.get("devices",function(err,res){
			if(err){
				return null
			}else{
				return res;
			}
			
		})
	}
	
	saveDevicesToDB(devices)
	{
		var devicekeys = Object.keys(devices)
		var db = this.db
		if(devicekeys.length){
			//Save to DB
			//check if devices exist
			db.get('devices',function(err,res){
				if(err){
					if(err.name=='not_found'){
						// devices do not exist
						var devicesObj = {_id:"devices",devices:{}}
						for(var i=0;i<devicekeys.lenght;i++){
							devicesObj.devices[devicekeys[i]] = devices[devicekeys[i]].toObject();
						}
						db.put(devicesObj,function(err,res){
							if(!err){
								// maybe emit something here 
								console.log('successfully saved the devices')
							}else{
								console.log('error saving devices: ',err)
							}
						})
						
					}else{
						//general error
						console.log('error:',err)
					}
				}else{
					//devices exist need to update or add new
					var oldDevices = res.devices;
					var oldDevicekeys = Object.keys(oldDevices);
					
					for(var i=0;i<oldDevicekeys.lenght;i++){
						for(var d=0;d<devicekeys.lenght;d++){
							//devicesObj.devices[devicekeys[i]] = devices[devicekeys[i]].toObject();
							if(oldDevicekeys[i]==devicekeys[d]){
								// if exist then update;
								oldDevices[oldDevicekeys[i]] = devices[devicekeys[d]].toObject();
							}else{
								// if it doesnt then add
								oldDevices[devicekeys[d]] = devices[devicekeys[d]].toObject();
							}
						}
						
					}
					
					db.put(res,function(err,res){
							if(!err){
								// maybe emit something here 
								console.log('successfully updated the devices')
							}else{
								console.log('error updating devices: ',err)
							}
					})
					
					
				}
				
			})
			
			
			
		}
	}
	
	deleteAllDevices(){
		this.devices = {};
		//delete also from db;
	}

	createDevice(message, rinfo){
		//Bytes 0x3a-0x40 of any unicast response will contain the MAC address of the target device.
			//58-64 mac
			//52-53 device Type
		
		var deviceId = message[52] | message[53] << 8
		var deviceIdToHex = deviceId.toString(16);
		var mac  = message.slice(58,64).toJSON().data;
		var host = rinfo.address
		console.log('mac',mac) // mac
		console.log('deviceId',deviceId)
		console.log('deviceIdToHex',deviceIdToHex) // device
		
		var device = null;
		switch (deviceId){
			case 0: 	// SP1
				break;
			case 10001: 	// SP2
				break;
			case 10009:  //Honeywell SP2
			case 31001:
			case 10010:
			case 31002:
				break;
			case 10016: 	//SPMini
				break;
			case 30014: 	//SP3
				break;
			case 10024: 	//SPMini2
				break;
			case 10035:
			case 10046: 	//OEM branded SPMini
				break;
			case 10038: 	//SPMiniPlus
				break;
			case 10002: 	//RM2
				break;
			case 10039:  //RM Mini
				console.log("Rm Mini")
				device = new RM({host:host,mac:mac});
				break;
			case 10045: 	//RM Pro Phicomm
				break;
			case 10115: 	//RM2 Home Plus
				break;
			case 10108: 	//RM2 Home Plus GDT
				break;
			case 10026 : 	//RM2 Pro Plus
				console.log("RM2 Pro Plus")
				device = new RM({host:host,mac:mac});
				break;
			case 10119: 	//RM2 Pro Plus2
				break;
			case 10123: 	//RM2 Pro Plus BL
				break;
			case 10127: 	//RM Mini Shate
				break;
			case 10004: 	//A1
				break;
			default:
				device = new Device({host:host,mac:mac})
				break;
				

		}

		if(device==null){
			console.log('did not find any devices');
		}else{
			this.devices[host] = device; //TODO: may need to change this due to the fact that ip address of device might change better use the device code;
			//device.start();
		}
		
	}



}




module.exports = DiscoverService
//server.discover();

