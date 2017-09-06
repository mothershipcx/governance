var Voting = artifacts.require('Voting')

const mspAddress = {
  main: '0x68AA3F232dA9bdC2343465545794ef3eEa5209BD',
  ropsten: '0x1b10A9D3517b29CCF8b39320Cd94468dA049a927'
}
endBlock = '1575507'

module.exports = async function(deployer, network) {
  if (network === 'development') return // Don't deploy on tests

  const voting = await Voting.new(main, 2, endBlock)
  console.log('Voting:', voting.address)
}
