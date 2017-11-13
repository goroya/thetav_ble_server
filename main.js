const noble = require('noble');
const restify = require('restify');
const axios = require('axios')

const bleServiceTable = {
    SHOOTING_CONTROL_COMMAND: {
        uuid: '1d0f36028dfb43409045513040dad991',
        charaTable: {
            TAKE_PICTURE_CHARA_UUID: 'fec1805c89054477b862ba5e447528a5',
        },
    },
    BLUETOOTH_CONTROL_COMMAND: {
        uuid: '0f2917460c80472687a73c501fd3b4b6',
        charaTable: {
          AUTH_BLUETOOTH_DEVICE_CHARA_UUID:    'ebafb2f00e0f40a2a84fe2f098dc13c3',
        },
    },
};

(async () => {
    try {
        /*
        const ble = await axios.post(
            'http://192.168.1.1/osc/commands/execute',
             {
                 "name": "camera._setBluetoothDevice",
                 "parameters": {
                     "uuid": "11111111-1111-1111-1111-111111111111",
                 }
             }
        );
        console.log(ble.data);
        */
        bleObject = {};
        noble.on('stateChange', (state) => {
            if (state === 'poweredOn') {
                console.log('.startScanning');
                noble.startScanning();
            } else {
                console.log('.stopScanning');
                noble.stopScanning();
            }
        });
        await new Promise((resolve, reject) => {
            noble.on('discover', (peripheral) => {
                peripheral.connect(function(error) {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    console.log('connected to peripheral: ' + peripheral.uuid);
                    peripheral.discoverServices(
                        [
                            bleServiceTable.SHOOTING_CONTROL_COMMAND.uuid,
                            bleServiceTable.BLUETOOTH_CONTROL_COMMAND.uuid,
                        ],
                        (error, services) => {
                            if (error) {
                                console.error(error);
                                return;
                            }
                            console.log('discovered the following services:');
                            for (var i in services) {
                                console.log('  ' + i + ' uuid: ' + services[i].uuid);
                                const service = services[i];
                                const charaList = [];
                                switch (service.uuid) {
                                    case bleServiceTable.SHOOTING_CONTROL_COMMAND.uuid:
                                        charaList.push(bleServiceTable.SHOOTING_CONTROL_COMMAND.charaTable.TAKE_PICTURE_CHARA_UUID);
                                        break;
                                    case bleServiceTable.BLUETOOTH_CONTROL_COMMAND.uuid:
                                        charaList.push(bleServiceTable.BLUETOOTH_CONTROL_COMMAND.charaTable.AUTH_BLUETOOTH_DEVICE_CHARA_UUID);
                                        break;
                                    default:
                                        console.error('Unknown Service');
                                        return;
                                }
                                bleObject[service.uuid] = {};
                                service.discoverCharacteristics(
                                    charaList,
                                    (error, characteristics) => {
                                        console.log('discovered the following characteristics:');
                                        for (let i in characteristics) {
                                            const chara = characteristics[i];
                                            console.log('  ' + i + ' uuid: ' + chara.uuid);
                                            bleObject[chara._serviceUuid][chara.uuid] = chara;
                                            if(chara.uuid == bleServiceTable.BLUETOOTH_CONTROL_COMMAND.charaTable.AUTH_BLUETOOTH_DEVICE_CHARA_UUID){
                                                console.log('Write auth');
                                                chara.write(new Buffer('11111111-1111-1111-1111-111111111111'), true, (error) => {
                                                    if (error) {
                                                        reject(error);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                );
                            }
                            resolve();
                        }
                    );
                });
            });
        });
        console.log("AAAA");
        const server = restify.createServer();
        server.get('/', (req, res, next) => {
            console.log(bleObject);
            console.log(bleServiceTable.SHOOTING_CONTROL_COMMAND.uuid);
            console.log(bleServiceTable.SHOOTING_CONTROL_COMMAND.charaTable.TAKE_PICTURE_CHARA_UUID);
            console.log(bleObject[bleServiceTable.SHOOTING_CONTROL_COMMAND.uuid][bleServiceTable.SHOOTING_CONTROL_COMMAND.charaTable.TAKE_PICTURE_CHARA_UUID]);
            bleObject[bleServiceTable.SHOOTING_CONTROL_COMMAND.uuid][bleServiceTable.SHOOTING_CONTROL_COMMAND.charaTable.TAKE_PICTURE_CHARA_UUID]
            .write(new Buffer([1]), true, (error) => {
                if (error) {
                    res.send({result: 'NG'});
                    return next();
                }
                res.send({result: 'OK'});
                return next();
            });
        });
        
        server.listen(8080, function() {
            console.log('%s listening at %s', server.name, server.url);
        });
    } catch (err) {
        console.error(err);
    }
})();
