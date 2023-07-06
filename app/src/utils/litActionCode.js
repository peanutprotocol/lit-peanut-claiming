const go = async () => {
  const url =
    "https://oauth2.googleapis.com/tokeninfo?id_token=" + access_token;

  const response = await fetch(url);

  const data = await response.json();

  const email = data.email;

  const messageHash = ethers.utils.id(email);

  const toSign = ethers.utils.arrayify(
    ethers.utils.hashMessage(
      ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ["bytes32", "address"],
          [ethers.utils.arrayify(messageHash), claimer]
        )
      )
    )
  );

  const sigShare = await Lit.Actions.signEcdsa({
    toSign,
    publicKey,
    sigName: "sig1",
  });
};

go();
