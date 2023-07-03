// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";

contract LockAndClaimVault {

    address immutable public litActionSigner;

    bytes public hashedEmail;

    uint256 public amount;

    address public token;

    constructor(
        bytes memory _hashedEmail,
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
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) {
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", "66", hashedEmail));
        
        require(ecrecover(hash, _v, _r, _s) == litActionSigner);
        _;
    }

    function verify(
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public view returns(
        bytes32,
        address
    ) { 
        // bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", "66", abi.encodePacked(hashedEmail, msg.sender))); // What I'm trying to do, doesn't work rn
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", "66", hashedEmail));
        
        return (hash, ecrecover(hash, _v, _r, _s));
    }

    function verifyWithHash(
        bytes memory hash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns(
        bytes32,
        address
    ) {
        // bytes32 hash = keccak256(abi.encode(messageHash, sender));
        bytes32 computedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", "66", hash)); //66? lol idk why 32 isn't working for me
        return (
            computedHash,
            ecrecover(computedHash, _v, _r, _s)
        );
    }

    function setReceiver(
        bytes memory _hashedEmail
    ) public {
        hashedEmail = _hashedEmail;
    }

    function claim(
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public isSigFromLitAction(
        _v,
        _r,
        _s
    ) {
        IERC20(token).transfer(msg.sender, amount);
    }
    
}