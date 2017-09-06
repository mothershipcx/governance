pragma solidity ^0.4.15;

import "./ERC20Basic.sol";

contract Token is ERC20Basic{
  /// @dev Queries the balance of `_owner` at a specific `_blockNumber`
  /// @param _owner The address from which the balance will be retrieved
  /// @param _blockNumber The block number when the balance is queried
  /// @return The balance at `_blockNumber`
  function balanceOfAt(address _owner, uint _blockNumber) constant returns (uint);
}
