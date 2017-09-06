var abi = require('ethereumjs-abi')

var parameterTypes = ['uint8', 'address', 'uint']
var parameterValues = [
  '2',
  '0x1b10A9D3517b29CCF8b39320Cd94468dA049a927',
  '1575657'
]

var encoded = abi.rawEncode(parameterTypes, parameterValues)

console.log(encoded.toString('hex'))
