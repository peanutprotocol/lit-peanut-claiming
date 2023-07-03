const go = async () => {

    try { 
        const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + access_token;

        const response = await fetch(url);
    
        const data = await response.json();

        const hashedEmail = ethers.utils.id(data.email);

        const sigShare = await Lit.Actions.ethPersonalSignMessageEcdsa({ message: hashedEmail, publicKey, sigName: "sig1" });
    } catch (e) {
        LitActions.setResponse({response: JSON.stringify({error: e})})
    }
};

go();