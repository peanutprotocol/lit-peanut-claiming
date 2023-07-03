// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./LockAndClaimVault.sol";

contract LockAndClaimVaultFactory {

    address public litActionSigner;

    constructor(
        address _litActionSigner
    ) {
        litActionSigner = _litActionSigner;
    }

    function create(
        bytes memory _hashedEmail,
        uint256 _amount,
        address _token
    ) public returns(
        address
    ) {
        address vault =  address(new LockAndClaimVault(
            _hashedEmail,
            _amount,
            _token,
            litActionSigner
        ));
        
        IERC20(_token).transferFrom(msg.sender, vault, _amount);

        return vault;
    }
}