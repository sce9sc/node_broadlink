var dgram = require('dgram'); 
var server = dgram.createSocket("udp4"); 
var crypto = require('crypto');
var moment = require('moment');
var EventEmitter = require('events');
var aesjs = require('aes-js');

// var d = new Buffer('00010203','hex')
// var he = d.toString('hex');

var tvcommand = [
38,0,140,0,76,22,37,21,18,21,
38,21,18,21,38,21,18,21,18,21,38,21,18,21,18,21,18,21,18,0,
3,78,76,21,38,21,18,21,38,21,18,21,37,22,18,21,18,21,38,21,18,21,18,
21,18,21,18,0,3,77,76,22,37,21,18,22,37,21,18,21,38,21,18,
21,18,21,38,21,18,21,18,21,18,22,
17,0,3,76,78,22,37,21,18,21,38,21,18,21,38,21,18,21,18,
21,38,21,19,20,18,21,18,21,18,0,3,77,
77,21,37,22,17,22,37,22,18,21,37,21,18,21,18,
22,37,21,18,21,18,22,17,22,18,0,13,5,0,0,0,0,0,0,0,0,0,0,0,0
] 

class Device extends EventEmitter{
	constructor(params)
	{
		super();
		this.host = params.host;
		this.mac = params.mac;
		this.key = params.key || [0x09, 0x76, 0x28, 0x34, 0x3f, 0xe9, 0x9e, 0x23, 0x76, 0x5c, 0x15, 0x13, 0xac, 0xcf, 0x8b, 0x02]
		this.iv = params.iv || [0x56, 0x2e, 0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58]
		this.id = params.id || [0, 0, 0, 0]
		this.type = params.type|| "device"
		this.authorized= false;
		this.PORT = params.port ||80;
		this.BROADCAST_ADDR = params.broadcastAddr || "255.255.255.255";
		this.name=params.name||"";
		
		this.server = null;
		this.count = 0xffff;

		this.issuedCmd = null;
		
		this.start() // may need to make the call outside of this scope
		

	}
	
	start(){
		if(this.server==null){
			this.server = dgram.createSocket("udp4"); 
			this.server.bind(()=>{
				this.serverAddress = this.server.address();
				this.server.setBroadcast(true);
			
			});

			this.server.on('listening', () =>{this.onlistening()});
			this.server.on('message', (message, rinfo)=>{this.onmessage(message,rinfo)});
			this.server.on('close',()=>{this.server=null})
		}else{
			console.log("server already running")
		}
	}
	
	onlistening(){
		this.serverAddress = this.server.address();
	    console.log('UDP Client listening on ' + this.serverAddress.address + ":" + this.serverAddress.port);	  
	    this.auth()  
	}
	
	onmessage(message, rinfo){
		console.log('device specific Message')
		
		// will be overwritten 
		
	}

	decrypt(buffer){
		// var encoding = "binary"
		// var buffkey = new Buffer(this.key)
		// var buffiv = new Buffer(this.iv)
		// var decipher = crypto.createDecipheriv('aes-128-cbc', buffkey, buffiv)
		// //var dec = Buffer.concat([decipher.update(buffer) , decipher.final()]);
		// var dec = decipher.update(buffer,encoding)
		
		// console.log(dec)
		//return dec 

		var buffkey = new Buffer(this.key)
 		var buffiv = new Buffer(this.iv)
 		var aesCbc = new aesjs.ModeOfOperation.cbc(buffkey, buffiv);
 		var decryptedBytes = aesCbc.decrypt(buffer);
 		return decryptedBytes;
	}


 	encrypt(buffer){
 	// 	var encoding = "binary"
 	// 	var buffkey = new Buffer(this.key)
		// var buffiv = new Buffer(this.iv)
		// var cipher = crypto.createCipheriv('aes-128-cbc', buffkey, buffiv)
 	// 	//var crypted = Buffer.concat([cipher.update(buffer),cipher.final()]);
 	// 	var crypted = cipher.update(buffer)
 	// 	return crypted;
 		var buffkey = new Buffer(this.key)
 		var buffiv = new Buffer(this.iv)
 		var aesCbc = new aesjs.ModeOfOperation.cbc(buffkey, buffiv);
 		var encryptedBytes = aesCbc.encrypt(buffer);
 		return encryptedBytes;
	}

	send_packet(command,payload){
		this.count = (this.count + 1) & 0xffff

		var packet = new Array(56);
		packet[0] = 0x5a
	    packet[1] = 0xa5
	    packet[2] = 0xaa
	    packet[3] = 0x55
	    packet[4] = 0x5a
	    packet[5] = 0xa5
	    packet[6] = 0xaa
	    packet[7] = 0x55

	    // packet[8] = 0x00
	    // packet[9] = 0x00
	    // packet[10] = 0x00
	    // packet[11] = 0x00
	    // packet[12] = 0x00
	    // packet[13] = 0x00
	    // packet[14] = 0x00
	    // packet[15] = 0x00
	    // packet[16] = 0x00
	    // packet[17] = 0x00
	    // packet[18] = 0x00
	    // packet[19] = 0x00
	    // packet[20] = 0x00
	    // packet[21] = 0x00
	    // packet[22] = 0x00
	    // packet[23] = 0x00
	    // packet[24] = 0x00
	    // packet[25] = 0x00
	    // packet[26] = 0x00
	    // packet[27] = 0x00
	    // packet[28] = 0x00
	    // packet[29] = 0x00
	    // packet[30] = 0x00
	    // packet[31] = 0x00

	    //packet[32] = checksum //Checksum of full packet as a little-endian 16 bit integer 0x20-0x21
	    //packet[33] = checksum
	    // packet[34] = 0x00
	    // packet[35] = 0x00

	    packet[36] = 0x2a
	    packet[37] = 0x27
	    packet[38] = command //Command code as a little-endian 16 bit integer

	    packet[40] = 174//Packet count as a little-endian 16 bit integer error here
	    packet[41] = 25 // error here
	    packet[42] = this.mac[0]
	    packet[43] = this.mac[1]
	    packet[44] = this.mac[2]
	    packet[45] = this.mac[3]
	    packet[46] = this.mac[4]
	    packet[47] = this.mac[5]
	    packet[48] = this.id[0]
	    packet[49] = this.id[1]
	    packet[50] = this.id[2]
	    packet[51] = this.id[3]

	    //packet[52] = checksum  //Checksum of packet header as a little-endian 16 bit integer 0x34-0x35
	    //packet[53] = checksum
	    // packet[54] = 0x00
	    // packet[55] = 0x00

	    //add payload after this

	    var checksum = 0xbeaf;
	    for(var i=0; i<payload.length; i++){
	    	checksum += isNaN(payload[i])?0:payload[i];
	    	checksum = checksum & 0xffff;
	    } 

	
	    var buffPayload = new Buffer(payload);
	    var encPayload = this.encrypt(buffPayload);
	

	    packet[52] = checksum & 0xff
	    packet[53] = checksum >> 8
	 
	    var encPayloadData = encPayload.toJSON().data
	    for(var f=0; f<encPayloadData.length; f++){ // add encPayload to packet
	    	//console.log(encPayloadData[i]);
      		packet.push(encPayloadData[f])   //Problem here
      	}

     
	    checksum = 0xbeaf
   		for(var i=0; i<packet.length;i++){
	    	checksum += isNaN(packet[i])?0:packet[i];
	    	checksum = checksum & 0xffff;
	    } 

    
	    packet[32] = checksum & 0xff
    	packet[33] = checksum >> 8

   
    	//Need to Send the packet
    	
		var buffPacket = new Buffer(packet)
	
		this.server.send(buffPacket, 0, buffPacket.length, this.PORT, this.host, function() {
        	console.log("Sent buffPacket");
        	buffPacket.toJSON().data.forEach(function(d){
        		console.log(d);
        	})
    	});


	}
	
	on_auth(message, rinfo){

		var enc_payload = message.slice(56)
		var dec_payload = this.decrypt(enc_payload);

		this.id = dec_payload.slice(0,4).toJSON().data;
		this.key = dec_payload.slice(4,20).toJSON().data
		this.authorized = true;

		this.issuedCmd = null;

		this.emit('authorized')

		/*this.enter_learning({
			device:"TV",
			command:"ON"
		})
		/*
		command must be
		{
			device:TV
			command:"ON"
		}
		
		*/
		/*
		setTimeout(()=>{
			console.log("get code")
			this.check_data()
		},6000)
		*/
		this.send_data(0)
	}

	auth(){
		if(this.issuedCmd ==null)
		{
			this.issuedCmd = "on_auth";
			var deviceName = "Test  1";
			var payload = new Array(80);
			payload[4] = 0x31
		    payload[5] = 0x31
		    payload[6] = 0x31
		    payload[7] = 0x31
		    payload[8] = 0x31
		    payload[9] = 0x31
		    payload[10] = 0x31
		    payload[11] = 0x31
		    payload[12] = 0x31
		    payload[13] = 0x31
		    payload[14] = 0x31
		    payload[15] = 0x31
		    payload[16] = 0x31
		    payload[17] = 0x31
		    payload[18] = 0x31    
		    
		    payload[30] = 0x01
		    payload[45] = 0x01
		    
		    payload[48] = deviceName.charCodeAt(0)//ord('T')  //NULL-terminated ASCII string containing the device name
		    payload[49] = deviceName.charCodeAt(1)//ord('e')
		    payload[50] = deviceName.charCodeAt(2)//ord('s')
		    payload[51] = deviceName.charCodeAt(3)//ord('t')
		    payload[52] = deviceName.charCodeAt(4)//ord(' ')
		    payload[53] = deviceName.charCodeAt(5)//ord(' ')
		    payload[54] = deviceName.charCodeAt(6)//ord('1')

		    //var buff = new Buffer(payload)
		    //console.log("encrypt",this.encrypt(buff));
		    //return
		    this.send_packet(0x65,payload)
		}else{
			console.log("pending command")
		}

	}
	
	

	
}

class RM extends Device{
	constructor(params){
		super(params);
		this.type = params.type || "RM"
		
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
		
		this.commands= params.commands || {devices:{}}//fakeCommands;
		
		this.learningCommand={}
		

	}
	
	clearCmd(){
		this.issuedCmd = null;
	}
	
	toObject(){ // TODO: no method overwrite;
		return {
			host:this.host,
			mac:this.mac,
			key:this.key,
			iv:this.iv,
			id:this.id,
			count:this.count,
			type:this.type,
			authorized:this.authorized,
			PORT: this.PORT,
			BROADCAST_ADDR:this.BROADCAST_ADDR,
			name:this.name,
			commands:this.commands
		}
	}

	onmessage(message, rinfo){
		console.log('RM device specific Message')
		// we need to find the command that was issued;
		// and invoke the realative on event 
		if(this.issuedCmd!=null){
			switch(this.issuedCmd){
				case 'check_temperature':
					this.onCheck_temperature(message, rinfo);
					break;
				case 'enter_learning':
					this.onLearning(message, rinfo);
					break;
				case 'check_data':
					this.onCheck_data(message, rinfo);
					break;
				case 'send_data':
					this.onSend_data(message, rinfo);
					break;
				case 'on_auth':
					this.on_auth(message, rinfo);
				default:
					break;
			}
			
		}
		
	}
	
	
	// get learning
	check_data(){
		if(this.issuedCmd==null){
			this.issuedCmd = 'check_data';
			var packet = new Array(16);
			packet[0] = 4
			this.send_packet(0x6a,packet)
		}else{
			console.log('pending command')
		}
	}
	
	onCheck_data(message, rinfo){
		var err = message[34] | (message[35] << 8)
		if(err==0){
			var enc_payload = message.slice(56)  //0x38
			var dec_payload = this.decrypt(enc_payload);
			var dec_payload_data = dec_payload.toJSON().data.slice(4);
			//console.log(dec_payload_data)
			console.log("command learned")
			
			dec_payload_data.forEach(function(d){
				console.log(d)
			})
			
			//this.learningCommand.value = dec_payload_data;
			
			if(this.commands.devices[this.learningCommand.device]==undefined){
				this.commands.devices[this.learningCommand.device] = {commands:{}}
				this.commands.devices[this.learningCommand.device].commands[this.learningCommand.command] = dec_payload_data
			}else{
				//device exist thus we need to update or add the command
				var deviceCommands = this.commands.devices[this.learningCommand.device].commands;
				deviceCommands[this.learningCommand.command] = dec_payload_data
			}
			
			
			this.emit('learned');
		}
		this.issuedCmd = null;
	}



	send_data(command){
		
		
		var packet = [0x02, 0x00, 0x00, 0x00]
		dd.forEach(function(f){
			packet.push(f)
		})
		this.send_packet(0x6a,packet)

		if(this.issuedCmd==null){
			if(this.commands[command]!=undefined){
				var cmd = this.commands[command]
				var packet = [0x02, 0x00, 0x00, 0x00]
				packet += cmd
				this.send_packet(0x6a,packet)
				
			}else{
				console.log("No command found")
			}
		}else{
			console.log('pending command')
		}
	}
	
	onSend_data(message, rinfo){
		// no need  only sending 
		this.issuedCmd = null;
		this.emit('sendCmdMode');
	}

	enter_learning(command){
		/*
		command must be
		{
			device:TV
			command:"ON"
		}
		
		*/
		
		if(this.issuedCmd==null){
			this.issuedCmd = 'enter_learning';
			var packet = new Array(16);
			packet[0] = 3
			this.send_packet(0x6a,packet)
			var cmd = {}
			cmd.type = command;
			cmd.value = null;
			this.learningCommand=cmd;
		}else{
			console.log('pending command')
		}
		
	}
	
	onLearning(message, rinfo){
		// no need  only sending 

		console.log("ON LEARNING")
		this.issuedCmd = null;
		this.emit('learningMode');
	}

	check_temperature(){
		if(this.issuedCmd==null){
			this.issuedCmd = 'check_temperature';
			var packet = new Array(16);
			packet[0] = 3
			this.send_packet(0x6a,packet)
		}else{
			console.log('pending command')
		}
	}
	
	onCheck_temperature(message, rinfo){
		console.log("onCheck_temperature")
		message.forEach(function(d){
						console.log(d)
					})
		console.log("========")

		var err = message[34] | (message[35] << 8)
		if(err==0){
			var enc_payload = message.slice(56)  //0x38
			var dec_payload = this.decrypt(enc_payload);
			var dec_payload_data = dec_payload.toJSON().data;

			dec_payload.forEach(function(d){
				console.log(d)
			})

			/*
			if type(payload[0x4]) == int:
				temp = (payload[0x4] * 10 + payload[0x5]) / 10.0
			  else:
				temp = (ord(payload[0x4]) * 10 + ord(payload[0x5])) / 10.0
			*/
			
			var temp = dec_payload[4] *10 + dec_payload[5] /10.0
			console.log('temp',temp);
			this.emit('temperature',temp)
		
		}else{
			console.log("error")
		}
		this.issuedCmd = null;
	}

}

module.exports = {RM,Device} 
