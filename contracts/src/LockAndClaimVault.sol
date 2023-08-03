// SPDX-License-Identifier: The Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";

contract LockAndClaimVault {

    address immutable public litActionSigner;

    bytes32 public hashedEmail;

    uint256 public amount;

    address public token;

    constructor(
        bytes32 _hashedEmail,
        uint256 _amount,
        address _token,
        address _litActionSigner
    ) {
        hashedEmail = _hashedEmail;
        amount = _amount;
        token = _token;
        litActionSigner = _litActionSigner;
    }

    modifier isSigFromLitAction(
        address claimer,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) {
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(hashedEmail, claimer))));
        
        require(ecrecover(hash, _v, _r, _s) == litActionSigner);
        _;
    }

    function verify(
        address claimer,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public view returns(
        bytes32,
        address
    ) { 
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(hashedEmail, claimer))));
        
        return (hash, ecrecover(hash, _v, _r, _s));
    }

    function setReceiver(
        bytes32 _hashedEmail
    ) public {
        hashedEmail = _hashedEmail;
    }

    function claim(
        address claimer,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public isSigFromLitAction(
        claimer,
        _v,
        _r,
        _s
    ) {
        IERC20(token).transfer(msg.sender, amount);
    }
    
}