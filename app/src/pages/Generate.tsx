import * as React from "react"
import {
  Text,
  Heading,
  Flex,
  Stack,
  Button,
  HStack,
  Input,
  Select,
  IconButton,
  Box,
  Spinner,
  VStack,
} from "@chakra-ui/react"
import tokens from "../utils/tokens.json"
import { utils, providers, Contract } from "ethers"
import { CopyIcon } from "@chakra-ui/icons"
import config from "../config.json"
import erc20ABI from "../../src/utils/ERC20.json";
import factoryABI from "../../src/utils/ClaimAndLockVaultFactory.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const Generate = () => {

  const [address, setAddress] = React.useState<string>('');

  const [signer, setSigner] = React.useState<providers.JsonRpcSigner>();

  const [email, setEmail] = React.useState<string>('');

  const [token, setToken] = React.useState<string>('');
  
  const [amount, setAmount] = React.useState<string>('');

  const [res, setRes] = React.useState<string>('');

  const [loadingMessage, setLoadingMessage] = React.useState<string>('');

  const connect = async () => {
    const provider = new providers.Web3Provider(window.ethereum);

    setAddress((await provider.send("eth_requestAccounts", []))[0]);
    
    setSigner(provider.getSigner());
  }

  const generate = async () => {

    setLoadingMessage('Approving tokens...');

    const tokenContract = await new Contract(
        token,
        erc20ABI,
        signer
    )

    console.log(amount)

    const approval = await tokenContract.approve(
        config.vaultFactory,
        utils.parseEther(amount)
    )

    await approval.wait()

    setLoadingMessage('Creating vault...');

    const factory = new Contract(
        config.vaultFactory,
        factoryABI,
        signer
    )

    const tx = await factory.create(
        utils.arrayify(utils.id(email)),
        utils.parseEther(amount),
        token
    )

    const create = await tx.wait()

    setLoadingMessage('Generating link...');

    const vaultAddress = utils.defaultAbiCoder.decode(
      ['address'],
      create.logs[1].topics[2]
    )[0]

    const body = {
      token,
      receiver: email,
      amount: utils.parseEther(amount),
      vaultAddress
    }

    const shortURL = await fetch('http://localhost:8080/', {
      method: "POST",
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(body)
    })
    setRes((await shortURL.json()).id);
    setLoadingMessage('');
  }

  return (
    <Flex
      w={'full'}
      h={'100vh'}
      alignItems={'center'}
      justifyContent={'center'}
      direction={'column'}
      gap={'5'}
      overflowY={'scroll'}
    >
      <Stack w={{base: '95%', md: '400px'}}>
        <Flex alignItems={'center'} justifyContent={'space-between'} flexDirection={'column'} minH={'lg'} gap={10} my={10} p={10} rounded={'2xl'} boxShadow={'2xl'} bgColor={'#fffefe'}>
          { 
            loadingMessage ? 
              <VStack gap={20} w={'full'} h={'full'} justifyContent={'center'} alignItems={'center'}>
                <Spinner/>
                <Text>{loadingMessage}</Text>
              </VStack>
            :
              <>
                <Heading size={'lg'} fontWeight={'medium'}>Create A Claim Link</Heading>
                <Input
                    variant={'flushed'}
                    value={email}
                    w={'90%'}
                    placeholder={'Receiver Email'}
                    onChange={(e) => {setEmail(e.target.value)}}
                />
                <Select
                  w={'90%'}
                  placeholder='Select Token'
                  onChange={(e) => {
                    console.log(e.target.value)
                    setToken(e.target.value);
                  }}
                >
                  {
                    tokens?.map((token: any, i: number) => (
                      <option key={i} value={token[1]}>{token[0]}</option>
                    ))
                  }
                </Select>
                <Input
                    type={'number'}
                    w={'90%'}
                    variant={'flushed'}
                    value={amount}
                    placeholder={'Amount'}
                    onChange={(e) => {setAmount(e.target.value)}}
                />

                {
                  !address ? 
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
                    w={'300px'}
                    colorScheme={'purple'} 
                    onClick={generate}
                    isDisabled={!(email && token && amount)}
                    alignSelf={'center'}
                  >
                    Deploy Vault & Create Claiming Link
                  </Button>
                }
                { res && 
                  <HStack
                    bgColor={'purple.300'}
                    px={4}
                    py={2}
                    rounded={'lg'}
                  >
                    <Text>{window.location.host + "/" + res}</Text>
                    <IconButton
                      aria-label="Copy"
                      variant={'ghost'}
                      size={'sm'}
                      icon={<CopyIcon/>}
                      onClick={() => navigator.clipboard.writeText(window.location.origin + "/" + res)}
                    />
                  </HStack>
                }
              </>
          }
        </Flex>
      </Stack>
    </Flex>
  )
}
