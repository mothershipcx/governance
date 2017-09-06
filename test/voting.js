const Voting = artifacts.require('VotingMock')
const MSP = artifacts.require('MSPMock')

const assertFail = require('./helpers/assertFail')

contract('Voting', function(accounts) {
  let msp
  let voting

  const owner = accounts[0]
  const user = accounts[1]

  const blockNumber = 50000000
  const endBlock = 50030000
  const candidatesCount = 5

  beforeEach(async () => {
    msp = await MSP.new({ from: owner })
    msp.setMockedBlockNumber(blockNumber)
    voting = await Voting.new(candidatesCount, msp.address, endBlock, {
      from: owner
    })
    voting.setMockedBlockNumber(blockNumber)
  })

  it('Candidate ID cannot be 0', async () => {
    await assertFail(async function() {
      await voting.vote(0, { from: accounts[1] })
    })
  })

  it('Candidate ID cannot be greater than configured', async () => {
    const _count = await voting.candidates()
    assert.equal(_count, candidatesCount)
    await assertFail(async function() {
      await voting.vote(_count + 1, { from: accounts[1] })
    })
  })

  it('Voting increases voters count', async () => {
    assert.equal((await voting.votersCount()).toNumber(), 0)
    await voting.vote(1, { from: accounts[1] })
    assert.equal((await voting.votersCount()).toNumber(), 1)
    await voting.vote(1, { from: accounts[2] })
    assert.equal((await voting.votersCount()).toNumber(), 2)
  })

  it('Changing a vote does not increase voters count`', async () => {
    const voter = accounts[1]
    assert.equal((await voting.votersCount()).toNumber(), 0)
    await voting.vote(1, { from: voter })
    assert.equal((await voting.votersCount()).toNumber(), 1)
    await voting.vote(2, { from: voter })
    assert.equal((await voting.votersCount()).toNumber(), 1)
  })

  it('Should log a vote', async () => {
    watcher = voting.Vote()
    const voter = accounts[1]
    await voting.vote(2, { from: voter })
    const logs = watcher.get()
    assert.equal(logs[0].event, 'Vote')
    assert.equal(logs[0].args._voter, voter)
    assert.equal(logs[0].args._candidate, 2)
  })

  it('Can vote during the ending block', async () => {
    voting.setMockedBlockNumber(endBlock)
    assert.equal((await voting.votersCount()).toNumber(), 0)
    await voting.vote(1, { from: accounts[1] })
    assert.equal((await voting.votersCount()).toNumber(), 1)
  })

  it('Could not vote after ending block', async () => {
    voting.setMockedBlockNumber(endBlock + 1)
    await assertFail(async function() {
      await voting.vote(1, { from: accounts[1] })
    })
  })

  it('Get voting result with limit and offset', async () => {
    await msp.generateTokens(accounts[1], 100)
    await voting.vote(1, { from: accounts[1] })

    await msp.generateTokens(accounts[2], 150)
    await voting.vote(3, { from: accounts[2] })

    await msp.generateTokens(accounts[3], 200)
    await voting.vote(2, { from: accounts[3] })

    await msp.generateTokens(accounts[4], 250)
    await voting.vote(1, { from: accounts[4] })

    // chunk 1
    const [voters1, candidates1, amounts1] = await voting.getVoters(0, 2)
    assert.deepEqual(voters1, [accounts[1], accounts[2]])
    assert.deepEqual(candidates1.map(bn => bn.toNumber()), [1, 3])
    assert.deepEqual(amounts1.map(bn => bn.toNumber()), [100, 150])

    // chunk 2
    const [voters2, candidates2, amounts2] = await voting.getVoters(2, 2)
    assert.deepEqual(voters2, [accounts[3], accounts[4]])
    assert.deepEqual(candidates2.map(bn => bn.toNumber()), [2, 1])
    assert.deepEqual(amounts2.map(bn => bn.toNumber()), [200, 250])
  })

  it('Get voting result at specific block number', async () => {
    // Account 1 make gets MSP and make a vote at first block
    const blockNumber1 = blockNumber
    await msp.generateTokens(accounts[1], 100)
    await voting.vote(1, { from: accounts[1] })

    // Next block comes
    const blockNumber2 = blockNumber1 + 1
    msp.setMockedBlockNumber(blockNumber2)
    voting.setMockedBlockNumber(blockNumber2)

    // Generate more tokens for account 1
    await msp.generateTokens(accounts[1], 150)
    // Account 2 make a vole
    await msp.generateTokens(accounts[2], 200)
    await voting.vote(3, { from: accounts[2] })

    // Check voting at first block
    const [voters1, candidates1, amounts1] = await voting.getVotersAt(
      0,
      10,
      blockNumber1
    )
    assert.deepEqual(voters1, [accounts[1], accounts[2]])
    assert.deepEqual(candidates1.map(bn => bn.toNumber()), [1, 3])
    assert.deepEqual(amounts1.map(bn => bn.toNumber()), [100, 0])

    // Check voting at second block
    const [voters2, candidates2, amounts2] = await voting.getVotersAt(
      0,
      10,
      blockNumber2
    )
    assert.deepEqual(voters2, [accounts[1], accounts[2]])
    assert.deepEqual(candidates2.map(bn => bn.toNumber()), [1, 3])
    assert.deepEqual(amounts2.map(bn => bn.toNumber()), [250, 200])

    // It should return the end block results if block number is greater
    const [voters3, candidates3, amounts3] = await voting.getVotersAt(
      0,
      10,
      endBlock + 1
    )
    assert.deepEqual(voters3, [accounts[1], accounts[2]])
    assert.deepEqual(candidates3.map(bn => bn.toNumber()), [1, 3])
    assert.deepEqual(amounts3.map(bn => bn.toNumber()), [250, 200])
  })

  it('Get voting summary', async () => {
    await msp.generateTokens(accounts[1], 100)
    await voting.vote(1, { from: accounts[1] })

    await msp.generateTokens(accounts[2], 150)
    await voting.vote(3, { from: accounts[2] })

    await msp.generateTokens(accounts[3], 200)
    await voting.vote(1, { from: accounts[3] })

    const [candidates, amounts] = await voting.getSummary()
    assert.deepEqual(candidates.map(bn => bn.toNumber()), [1, 2, 3, 4, 5])
    assert.deepEqual(amounts.map(bn => bn.toNumber()), [300, 0, 150, 0, 0])
  })

  it('Claim tokens from voting contract', async () => {
    // Generate tokens for account 1
    await msp.generateTokens(user, 100)
    assert.equal(await msp.balanceOf(owner), 0)
    assert.equal(await msp.balanceOf(user), 100)
    assert.equal(await msp.balanceOf(voting.address), 0)

    // Transfer tokens to the voting contract
    await msp.transfer(voting.address, 100, { from: user })
    assert.equal(await msp.balanceOf(owner), 0)
    assert.equal(await msp.balanceOf(user), 0)
    assert.equal(await msp.balanceOf(voting.address), 100)

    // Not-owner could NOT claim tokens
    await assertFail(async function() {
      await voting.claimTokens(msp.address, { from: user })
    })

    // Contract owner could claim tokens
    await voting.claimTokens(msp.address, { from: owner })
    assert.equal(await msp.balanceOf(owner), 100)
    assert.equal(await msp.balanceOf(user), 0)
    assert.equal(await msp.balanceOf(voting.address), 0)
  })

  // TODO test claim ether
})
