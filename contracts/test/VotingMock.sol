pragma solidity ^0.4.11;

import '../Voting.sol';

// @dev VotingMock mocks current block number

contract VotingMock is Voting {
  uint blockNumberMock = 1;

  function VotingMock(uint8 _candidatesCount, address _msp, uint _cap, uint _endBlock)
    Voting(_candidatesCount, _msp, _cap, _endBlock) {}

  function getBlockNumber() internal constant returns (uint) {
    return blockNumberMock;
  }

  function setMockedBlockNumber(uint _b) public {
    blockNumberMock = _b;
  }
}
