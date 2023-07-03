import * as React from "react";
import {
  Text,
  VStack,
  Heading,
  Flex,
  Stack,
  Button,
  HStack,
  Input,
  Divider,
  Box,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { Link, useLoaderData } from "react-router-dom";
import { utils, providers, Contract } from "ethers";
import { ProviderType } from "@lit-protocol/constants";
import { FcGoogle } from 'react-icons/fc';
import config from "../config.json";
import vaultABI from "../../src/utils/ClaimAndLock.json";

export const Interact = () => {

  const { receiver, token, amount, vaultAddress, client, wallet, signature }: any = useLoaderData();

  const [address, setAddress] = React.useState<string>('');

  const [signer, setSigner] = React.useState<providers.JsonRpcSigner>();

  const [res, setResponse] = React.useState<string>('');

  const [balanceChanges, setBalanceChanges] = React.useState<any>([]);

  const [loading, setLoading] = React.useState<boolean>(false);

  const connect = async () => {
    const provider = new providers.Web3Provider(window.ethereum);

    setAddress((await provider.send("eth_requestAccounts", []))[0]);
    
    setSigner(provider.getSigner());
  }

  const signIn = async () => {
    const provider = client.getProvider(
      ProviderType.Google
    );
    await provider.signIn();
  };

  const execute = async () => {
    
    try {

      setLoading(true);

      const vault = new Contract(
        vaultAddress,
        vaultABI,
        signer
      )

      const claim = await vault.claim(
          signature.v, signature.r, signature.s
      )

      const tx = await claim.wait();

      setResponse(tx.transactionHash);

      setLoading(false);

    } catch (e) {
      console.log(e)
      setLoading(false);
    }

  }

  return (
    <Flex
      w={'full'}
      h={'100vh'}
      alignItems={'center'}
      justifyContent={'center'}
      direction={'column'}
      gap={'5'}
    >
      <Stack w={{base: '95%', md: '400px'}}>
        <Flex alignItems={'center'} justifyContent={'space-between'} flexDirection={'column'} minH={'lg'} gap={7} p={10} rounded={'2xl'} boxShadow={'2xl'} bgColor={'#fffefe'}>
          <Heading size={'lg'} fontWeight={'medium'}>Claim Tokens</Heading>
          <VStack
            w={'90%'}
            alignItems={'flex-start'}
            justifyContent={'start'}
          >
            <Heading size={'xs'} fontWeight={'bold'}>SUMMARY</Heading>
            <Divider/>
            <Text w={'full'}>Receiver <b>{receiver}</b></Text>
            <Text w={'full'}>Claiming <b>{utils.formatEther(amount)} USDC</b></Text>
          </VStack>
          { 
            wallet &&
            <VStack
              w={'100%'}
              alignItems={'flex-start'}
              justifyContent={'start'}
              borderRadius={'xl'}
              borderWidth={1}
              p={4}
            >
              {
                balanceChanges?.map((change: any, i: number) => (
                  <HStack w={'full'} key={i} justifyContent={'space-between'}>
                    <Image src={change.logo} maxWidth={'20px'} rounded={'md'} />
                    <Text fontSize={'xs'}>{change.from == wallet.address.toLowerCase() ? "-" : "+"} {parseFloat(change.amount).toFixed(2)} {change.symbol}</Text>
                  </HStack>
                ))
              }
            </VStack>
          }
          {
            loading ?
              <Spinner />
            : res ? 
              <Link to={`${config.etherscanUrl}tx/${res}`}>
                <Button
                  w={'200px'}
                  variant={'outline'}
                  alignSelf={'center'}
                >
                  View Receipt ↗
                </Button>
              </Link>
            : !signature ?
              <Button
                variant={'outline'}
                w={'200px'}
                alignSelf={'center'}
                leftIcon={<FcGoogle />}
                onClick={signIn}
              >
                <Text>Sign in with Google</Text>
              </Button>
              : !address ?
              <Button
                w={'200px'}
                colorScheme={'purple'} 
                onClick={connect}
                alignSelf={'center'}
              >
                Connect Wallet
              </Button>
              :
              <Button
                w={'200px'}
                colorScheme={'purple'} 
                onClick={execute}
                alignSelf={'center'}
              >
                Claim
              </Button>
              }
        </Flex>
      </Stack>
    </Flex>
  )
}
