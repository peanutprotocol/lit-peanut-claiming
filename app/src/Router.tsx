import { createBrowserRouter, Outlet } from "react-router-dom";
import { isSignInRedirect, LitAuthClient } from "@lit-protocol/lit-auth-client";
import { ProviderType } from "@lit-protocol/constants";
import { AuthMethod } from "@lit-protocol/types"
import config from "./config.json";
import { joinSignature, splitSignature } from "@ethersproject/bytes";
import { utils } from "ethers";
import { Interact } from "./pages/Interact";
import { Generate } from "./pages/Generate";

const router = createBrowserRouter([
    {
        path: "/",
		element: <Outlet/>,
		children: [
            {
                path: "/",
				element: <Generate/>,
            },
			{
                path: "/:id",
                loader: async ({ params }) => {
                    const id = params.id || "";
                    const res = await fetch('http://localhost:8080/' + id)
                    const data = await res.json();
                    const { token, receiver, amount, vaultAddress } = data;
                    console.log(data);
                    const client = new LitAuthClient({
                      litRelayConfig: {
                        relayApiKey: config.relayApiKey,
                      },
                    });
                  
                    client.initProvider(ProviderType.Google, {
                      redirectUri: window.location.origin + window.location.pathname,
                    }); 

                    let wallet, email, signature;

                    if(isSignInRedirect(window.location.href)) {

                        const id_token = new URL(window.location.href).searchParams.get('id_token');

                        email = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + id_token)
                            .then(res => res.json())
                            .then(res => res.email);

                        const litNodeClient = new LitNodeClient({
                            litNetwork: 'serrano',
                            debug: false,
                        });
                        await litNodeClient.connect();
                        
                        // Get the provider that was used to sign in
                        const provider = client.getProvider(
                            ProviderType.Google,
                        );
                        
                        if(provider != null) {
                            // Get auth method object that has the OAuth token from redirect callback
                            const authMethod: AuthMethod = await provider.authenticate();
                        
                            const { authSig } = await litNodeClient.signSessionKey({
                                authMethods: [authMethod],
                                expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
                                resources: [],
                            });

                            const messageHash = utils.id(receiver);

                            const response = await litNodeClient.executeJs({
                                ipfsId: config.ipfsId,
                                authSig,
                                jsParams: {
                                    access_token: authMethod.accessToken,
                                    publicKey: config.pkpPublicKey
                                },
                            });
                            console.log(response);

                            const encodedSig = joinSignature({
                                r: '0x' + response.signatures.sig1.r,
                                s: '0x' + response.signatures.sig1.s,
                                v: response.signatures.sig1.recid
                            })

                            const splitSig = splitSignature(encodedSig)

                            signature = splitSig

                            console.log("Vault Address:", vaultAddress)

                            console.log("Lit Action ETH Address:", utils.verifyMessage(messageHash, encodedSig))
                        }
                    }

                    return { receiver, token, amount, vaultAddress, client, wallet, email, signature };
                },
				element: <Interact/>,
			},
            // {
			// 	path: "/:address/:function",
            //     loader: async ({ params }) => {
            //         const address = params.address || "";
            //         const signer = await getSigner();
            //         const code = await getSourceCode(address);
            //         return {address, code: code[0], signer, func: params.function};
            //     },
			// 	element: <Interact/>,
			// },
		]
    },
]);

export default router