// SPDX-License-Identifier: The Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LitVerifier is Ownable {
    address public litActionSigner;

    function setup(
        address _litActionSigner
    ) public onlyOwner returns (bytes32) {
        litActionSigner = _litActionSigner;
        bytes32 hash = keccak256(abi.encodePacked(_litActionSigner));
        return hash;
    }

    function verify(
        bytes32 hashedEmail,
        address claimer,
        bytes memory sig
    ) public view returns (bool) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(hashedEmail, claimer))
            )
        );

        (bytes32 _r, bytes32 _s, uint8 _v) = splitSignature(sig);

        return litActionSigner == ecrecover(hash, _v, _r, _s);
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))

            s := mload(add(sig, 64))

            v := byte(0, mload(add(sig, 96)))
        }
    }
}
