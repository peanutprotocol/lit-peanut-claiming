# Lit x Peanut Claiming

Demo Video: 

[https://youtu.be/o8FDGhqQpeQ](https://youtu.be/o8FDGhqQpeQ)

USDC Test Token: [https://goerli.etherscan.io/token/0x8acfc9d02fb13d83ee4cfa9102d50f7abd0c3656#writeContract](https://goerli.etherscan.io/token/0x8acfc9d02fb13d83ee4cfa9102d50f7abd0c3656#writeContract)

Vault Factory: [https://goerli.etherscan.io/address/0x3d14b5bdfc47463153a0cde6a346c64ff9028947](https://goerli.etherscan.io/address/0x3d14b5bdfc47463153a0cde6a346c64ff9028947)

Lock Contract Implementation: [https://goerli.etherscan.io/address/0x082bed45569b08a423483e2172166d72a1cf4040#code](https://goerli.etherscan.io/address/0x082bed45569b08a423483e2172166d72a1cf4040#code)

### Mint/Grant/Burn[](https://developer.litprotocol.com/pkp/pkpsandactions/#using-mintgrantburn)

Mint/Grant/Burn is a function allows you to create a PKP to grant access to one Lit Action only, in its entire lifetime

1. Mint the PKP
2. Grant access for a Lit Action to use it (Lit Action is just executing JS code on their decentralized network)
3. Burn the PKP (Now no one can use the PKP except for the granted Lit Action)

Example Usage (Gating a contract to a Lit Action, what I did):

1. Create a Lit Action that:
    1. verifies a Google OAuth token
    2. Check which email the oauth token corresponds to using google api
    3. Signs a message, the message being the resulting email + the claimer address
2. Mint/Grant/Burn a PKP (in the same tx) and grant this Lit Action to the PKP
3. Now, this PKP can only sign the email message in our Lit Action above.
4. The PKP has an eth address (hash of PKP’s pub key), in the contract, just verify that the signature is from the PKP
5. All signatures from this PKP come from the Lit Action, can only be emails + claimer address.

This is what the Lit Action looks like:

```jsx
const go = async () => {

    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + access_token;

    const response = await fetch(url);

    const data = await response.json();

    const email = data.email;

    const messageHash = ethers.utils.id(email);

    const toSign = ethers.utils.arrayify(
        ethers.utils.hashMessage(
            ethers.utils.arrayify(
                ethers.utils.solidityKeccak256(
                    ['bytes32', 'address'],
                    [ethers.utils.arrayify(messageHash), claimer]
                )
            )
        )
    )

    const sigShare = await Lit.Actions.signEcdsa({ toSign, publicKey, sigName: "sig1" });
};

go();
```

To mint the PKP: 

1. Upload the Lit Action to IPFS and get the CID
    
    *example: QmUDV5SNrXX44oLAr4o99jdF5XccypCrY8GnPW9GgAf9vr*
    
2. Get the Base58 decoded string of that ([http://lenschulwitz.com/base58](http://lenschulwitz.com/base58)):
    
    *0x122057502A2AF265686B783B138429C82573F20D1AEC5F8EB54AF09566662C84DEF3*
    
3. Call mintGrantAndBurnNext ([PKP Contract on Lit Explorer](https://lit-protocol.calderaexplorer.xyz/token/0x8F75a53F65e31DD0D2e40d0827becAaE2299D111/write-contract))
    
    Params: 
    
    - keyType: 2
    - ipfsCID: 0x122057502A2AF265686B783B138429C82573F20D1AEC5F8EB54AF09566662C84DEF3
    - value: 1 wei (just use the arrow button on the number thing)

1. View your PKP 

[https://explorer.litprotocol.com/pkps/15473383814346105268036421214402740466635327954611744943981091964835934653401](https://explorer.litprotocol.com/pkps/15473383814346105268036421214402740466635327954611744943981091964835934653401)

### Vault & Vault Factory

- To deploy, the only constructor argument (_litActionSigner) is the eth address of the PKP you just minted
    
    ```solidity
    address public litActionSigner;
    
    constructor(
            address _litActionSigner
    ) {
            litActionSigner = _litActionSigner;
    }
    ```
    
- It has a create function, which deploys a new vault and directly transfers erc20 tokens into it given:
    - the hash of the receiver email
    - the amount of tokens
    - the erc20 token address
    - litActionSigner (this is automatically put by the factory)
    
    This will set the parameters as global variables in the vault contract
    
    ```solidity
    function create(
            bytes32 _hashedEmail,
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
    ```
    
- The vault contract has one main function, claim, and its modifier “isSigFromLitAction”
    
    It takes the signature returned from the Lit Action (where your email is verified and then used as the message for the signature)
    
    Since the receiver (the hash of the email) was set by the depositor when the vault was created,
    
    the claimer only needs to give the signature from the lit action
    
    **IsSigFromLitAction** Modifier:
    
    ```solidity
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
    ```
    
    ************Claim************ function:
    
    ```solidity
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
    ```
    

### Flow

Depositor

- Specify token, amount, email
- Deploys vault contract with all of that

Claimer

- Signs message with email and claimer address through Lit Action
- Claim using signature, specifies the claimer in the signature

### I fixed the missing parts! This is non-frontrunnable since we’re specifying the claiming address in our signature
