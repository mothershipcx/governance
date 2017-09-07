var abi = require('ethereumjs-abi')

var parameterTypes = ['uint8', 'address', 'uint', 'uint']
var parameterValues = [
  '2',
  '0x68AA3F232dA9bdC2343465545794ef3eEa5209BD',
  '100000000000000000000000',
  '4272272'
]

var encoded = abi.rawEncode(parameterTypes, parameterValues)

console.log(encoded.toString('hex'))
