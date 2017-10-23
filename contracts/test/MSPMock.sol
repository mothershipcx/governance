pragma solidity ^0.4.11;

import "../interface/Token.sol";

contract MSPMock is Token {
  /// @dev `Checkpoint` is the structure that attaches a block number to a
  ///  given value, the block number attached is the one that last changed the
  ///  value
  struct  Checkpoint {
    // `fromBlock` is the block number that the value was generated from
    uint128 fromBlock;
    // `value` is the amount of tokens at a specific block number
    uint128 value;
  }

  // `balances` is the map that tracks the balance of each address, in this
  //  contract when the balance changes the block number that the change
  //  occurred is also included in the map
  mapping (address => Checkpoint[]) balances;

  uint blockNumberMock = 1;

  /// @notice Send `_amount` tokens to `_to` from `msg.sender`
  /// @param _to The address of the recipient
  /// @param _amount The amount of tokens to be transferred
  /// @return Whether the transfer was successful or not
  function transfer(address _to, uint256 _amount) public returns (bool success) {
    var _from = msg.sender;

    // NOTE no checks, it's a mock
    var previousBalanceFrom = balanceOf(_from);
    updateValueAtNow(balances[_from], previousBalanceFrom - _amount);
    var previousBalanceTo = balanceOf(_to);
    updateValueAtNow(balances[_to], previousBalanceTo + _amount);
    return true;
  }

  /// @notice Generates `_amount` tokens that are assigned to `_owner`
  /// @param _owner The address that will be assigned the new tokens
  /// @param _amount The quantity of tokens generated
  /// @return True if the tokens are generated correctly
  function generateTokens(address _owner, uint _amount) public returns (bool) {
    // NOTE no checks, it's a mock
    var previousBalanceTo = balanceOf(_owner);
    updateValueAtNow(balances[_owner], previousBalanceTo + _amount);
    return true;
  }

  /// @param _owner The address that's balance is being requested
  /// @return The balance of `_owner` at the current block
  function balanceOf(address _owner) public constant returns (uint256 balance) {
    return balanceOfAt(_owner, getBlockNumber());
  }

  /// @dev Queries the balance of `_owner` at a specific `_blockNumber`
  /// @param _owner The address from which the balance will be retrieved
  /// @param _blockNumber The block number when the balance is queried
  /// @return The balance at `_blockNumber`
  function balanceOfAt(address _owner, uint _blockNumber) public constant returns (uint) {
    Checkpoint[] storage checkpoints = balances[_owner];

    if (checkpoints.length == 0) return 0;

    // Shortcut for the actual value
    if (_blockNumber >= checkpoints[checkpoints.length-1].fromBlock)
      return checkpoints[checkpoints.length-1].value;
    if (_blockNumber < checkpoints[0].fromBlock) return 0;

    // Binary search of the value in the array
    uint min = 0;
    uint max = checkpoints.length-1;
    while (max > min) {
      uint mid = (max + min + 1)/ 2;
      if (checkpoints[mid].fromBlock<=_blockNumber) {
        min = mid;
      } else {
        max = mid-1;
      }
    }
    return checkpoints[min].value;
  }

  /// @dev `updateValueAtNow` used to update the `balances` map
  /// @param checkpoints The history of data being updated
  /// @param _value The new number of tokens
  function updateValueAtNow(Checkpoint[] storage checkpoints, uint _value) internal  {
    if ((checkpoints.length == 0)
        || (checkpoints[checkpoints.length -1].fromBlock < getBlockNumber())) {
      Checkpoint storage newCheckPoint = checkpoints[ checkpoints.length++ ];
      newCheckPoint.fromBlock =  uint128(getBlockNumber());
      newCheckPoint.value = uint128(_value);
    } else {
      Checkpoint storage oldCheckPoint = checkpoints[checkpoints.length-1];
      oldCheckPoint.value = uint128(_value);
    }
  }

  function getBlockNumber() internal constant returns (uint) {
    return blockNumberMock;
  }

  function setMockedBlockNumber(uint _b) public {
    blockNumberMock = _b;
  }
}
