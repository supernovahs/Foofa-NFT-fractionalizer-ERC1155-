import { Button, Card, Col, Menu, Row, Input } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
  AddressInput,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { Home, ExampleUI, Hints, Subgraph, Home2 } from "./views";
import { useStaticJsonRPC } from "./hooks";
import { local } from "web3modal";
import abiERC from "./ERC1155abi.json";

import { BigNumber } from "@ethersproject/bignumber";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.mumbai; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "rinkeby"];

  const [imgs, setImgs] = useState([]);
  const [selectedNft, setSelectedNft] = useState(null);
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [showListedNfts, setShowListedNfts] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();

  const [ctr, setCtr] = useState("");
  const [cadd, setCadd] = useState("");
  const [tid, setTid] = useState("");

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  useEffect(() => {
    setShowListedNfts(false);
  }, [location]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose");

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  // const counter= useContractReader(readContracts,"FooFa","counter");

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;
  /* const for Listing price  */
  const [Listingprice, setListingPrice] = useState();
  const [NFTtokenId, setNFTtokenId] = useState();
  const [NoOfTokens, setNoOfTokens] = useState();
  const [NoOfNFTs, setNoOfNFTs] = useState();
  const [Discount, setDiscount] = useState();
  const [NFTcontractAddress, setNFTcontractAddress] = useState();
  //
  /* const for buying NFT*/
  const [BuyNFTcontractAddress, setBuyNFTcontractAddress] = useState();
  const [BuyNFTtokenId, setBuyNFTtokenId] = useState();
  const [BuyNoOfNFTs, setBuyNoOfNFTs] = useState();
  //
  // const EthCostToPurchaseNFT = Listingprice * BuyNoOfNFTs;
  // console.log(Listingprice);
  // console.log(BuyNoOfNFTs);

  /* const for buying tokens */
  const [BuyNoOfTokens, setBuyNoOfTokens] = useState();
  const [SellNoOfTokens, setSellNoOfTokens] = useState();

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />
      <div className="content">
        <Switch>
          <Route exact path="/">
            {/* pass in any web3 props to this Home component. For example, yourLocalBalance */}
            <div className="heading">
              <h1>List NFT</h1>
            </div>
            <Home
              selectedNft={selectedNft}
              setSelectedNft={setSelectedNft}
              imgs={imgs}
              setImgs={setImgs}
              yourLocalBalance={yourLocalBalance}
              readContracts={readContracts}
              address={address}
              writeContracts={writeContracts}
              userSigner={userSigner}
              localProvider={localProvider}
            />
            {/* <Contract
            title= {"Mint NFTs"}
            name="YourCollectible"
            show={["balanceOf","approve","mint"]}
            price= {price}
            provider={localProvider}
            address={address}
            signer= {userSigner}
            contractConfig= {contractConfig}
            blockExplorer={blockExplorer}
          />           */}

            <div className="approve">
              <Button
                onClick={async () => {
                  if (selectedNft !== null) {
                    const UserNFTcontract = new ethers.Contract(selectedNft.contract_address, abiERC.abi, userSigner);
                    await tx(UserNFTcontract.setApprovalForAll(readContracts.FooFa.address, true));
                  }
                }}
              >
                Approve
              </Button>
            </div>

            <div className="card-wrapper">
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"Price at which you want to sell NFT"}
                  value={Listingprice}
                  onChange={e => {
                    setListingPrice(e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"No of ERC1155 tokens you want in return"}
                  value={NoOfTokens}
                  onChange={e => {
                    setNoOfTokens(e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"No of NFTs you want to List"}
                  value={NoOfNFTs}
                  onChange={e => {
                    setNoOfNFTs(e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"Discount for liquidity providers"}
                  value={Discount}
                  onChange={e => {
                    setDiscount(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="approve" id="list" style={{ padding: 8 }}>
              <Button
                onClick={async () => {
                  await tx(
                    writeContracts.FooFa.addListing(
                      Listingprice && ethers.utils.parseEther(Listingprice),
                      selectedNft.token_id,
                      selectedNft.contract_address,
                      NoOfTokens,
                      NoOfNFTs,
                      Discount && ethers.utils.parseEther(Discount),
                    ),
                  );
                  setSelectedNft(null);
                }}
              >
                List!
              </Button>
            </div>
            <div className="empty-div"></div>
          </Route>
          <Route exact path="/debug">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

            <Contract
              name="FooFa"
              price={price}
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
            <Contract
              name="YourCollectible"
              price={price}
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>
          <Route path="/hints">
            <div className="heading">
              <h1>Buy NFT</h1>
            </div>
            {/* <Hints
              address={address}
              yourLocalBalance={yourLocalBalance}
              readContracts={readContracts}
              address={address}
              writeContracts={writeContracts}
              userSigner={userSigner}
              localProvider={localProvider}
            /> */}

            <div className="buy-wrapper">
              {showListedNfts && (
                <Home2
                  selectedNft={selectedNft}
                  setSelectedNft={setSelectedNft}
                  imgs={imgs}
                  setImgs={setImgs}
                  yourLocalBalance={yourLocalBalance}
                  readContracts={readContracts}
                  address={readContracts.FooFa.address}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  localProvider={localProvider}
                  tx={tx}
                  address2={null}
                />
              )}
              <div className="flex-wrapper">
                <div style={{ padding: 8 }}>
                  <Button onClick={() => setShowListedNfts(!showListedNfts)}>Show Listed NFTs</Button>
                </div>
                <div style={{ padding: 8, width: "50%" }}>
                  <Input
                    style={{ textAlign: "center" }}
                    placeholder={"amount of NFT to buy"}
                    value={BuyNoOfNFTs}
                    onChange={e => {
                      setBuyNoOfNFTs(e.target.value);
                    }}
                  />
                </div>
                <div style={{ padding: 8 }}>
                  <Button
                    onClick={async () => {
                      const listingmapping = await tx(
                        readContracts.FooFa.ListingDetails(selectedNft.contract_address, selectedNft.token_id),
                      );
                      const listingprices = await listingmapping[0];
                      const listingprice = (BigNumber.from(listingprices) * BuyNoOfNFTs).toString();
                      console.log(listingprice);
                      console.log(typeof listingprice);
                      await tx(
                        writeContracts.FooFa.NFTbuy(selectedNft.contract_address, selectedNft.token_id, BuyNoOfNFTs, {
                          value: listingprice,
                        }),
                      );
                    }}
                    // new commit
                  >
                    Buy NFT!
                  </Button>
                </div>
              </div>
            </div>
          </Route>
          <Route path="/exampleui">
            <div className="heading">
              <h1>Buy Tokens</h1>
            </div>
            <div className="buy-wrapper">
              {showListedNfts && (
                <Home2
                  selectedNft={selectedNft}
                  setSelectedNft={setSelectedNft}
                  imgs={imgs}
                  setImgs={setImgs}
                  yourLocalBalance={yourLocalBalance}
                  readContracts={readContracts}
                  address={readContracts.FooFa.address}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  localProvider={localProvider}
                  tx={tx}
                  address2={null}
                />
              )}
              <div className="flex-wrapper">
                <div style={{ padding: 8 }}>
                  <Button onClick={() => setShowListedNfts(!showListedNfts)}>Show Listed NFTs</Button>
                </div>
                <div style={{ padding: 8, width: "50%" }}>
                  <Input
                    style={{ textAlign: "center" }}
                    placeholder={"No of tokens you want to buy"}
                    value={BuyNoOfTokens}
                    onChange={e => {
                      setBuyNoOfTokens(e.target.value);
                    }}
                  />
                </div>
                <div style={{ padding: 8 }}>
                  <Button
                    onClick={async () => {
                      const listingmappings = await tx(
                        readContracts.FooFa.ListingDetails(selectedNft.contract_address, selectedNft.token_id),
                      );
                      const counterval = BigNumber.from(listingmappings[2]).toString();
                      const price = BigNumber.from(listingmappings[0]);
                      const amount = BigNumber.from(listingmappings[4]);
                      const discount = BigNumber.from(listingmappings[3]);
                      const noOfTokens = BigNumber.from(listingmappings[5]);

                      const final = (((price * amount - discount) / noOfTokens) * BuyNoOfTokens).toString();

                      console.log(counterval);
                      console.log(final);
                      await tx(
                        writeContracts.FooFa.buyTokens(
                          counterval,
                          BuyNoOfTokens,
                          selectedNft.contract_address,
                          selectedNft.token_id,
                          { value: final },
                        ),
                      );
                    }}

                    //                 onClick={async() =>{
                    //                   const listingmappings= await tx(readContracts.FooFa.ListingDetails(selectedNft.contract_address,selectedNft.token_id));
                    //                   const counterval= listingmappings[3];

                    //                   await tx(writeContracts.FooFa.buyTokens(counterval,BuyNoOfTokens,selectedNft.contract_address, selectedNft.token_id))
                    //                 }}
                  >
                    Buy Tokens
                  </Button>
                </div>
              </div>
            </div>
          </Route>
          <Route path="/mainnetdai">
            <div className="heading">
              <h1>Sell Tokens</h1>
            </div>
            <div className="buy-wrapper">
              {showListedNfts && (
                <Home2
                  selectedNft={selectedNft}
                  setSelectedNft={setSelectedNft}
                  imgs={imgs}
                  setImgs={setImgs}
                  yourLocalBalance={yourLocalBalance}
                  readContracts={readContracts}
                  address={readContracts.FooFa.address}
                  address2={address}
                  writeContracts={writeContracts}
                  userSigner={userSigner}
                  localProvider={localProvider}
                  tx={tx}
                />
              )}
              <div className="flex-wrapper">
                <div style={{ padding: 8 }}>
                  <Button
                    onClick={async () => {
                      // const listingmapping = await tx(
                      //   readContracts.FooFa.ListingDetails(selectedNft.contract_address, selectedNft.token_id),
                      // );
                      // const seller = listingmapping[1];
                      // console.log(seller);
                      setShowListedNfts(!showListedNfts);
                    }}
                  >
                    Show Listed NFTs
                  </Button>
                </div>
                <div style={{ padding: 8, width: "50%" }}>
                  <Input
                    style={{ textAlign: "center" }}
                    placeholder={"tokens to sell"}
                    value={SellNoOfTokens}
                    onChange={e => {
                      setSellNoOfTokens(e.target.value);
                    }}
                  />
                </div>
                <div style={{ padding: 8 }}>
                  <Button
                    onClick={async () => {
                      const listingmappings = await tx(
                        readContracts.FooFa.ListingDetails(selectedNft.contract_address, selectedNft.token_id),
                      );
                      const counterval = BigNumber.from(listingmappings[2]).toString();

                      await tx(writeContracts.FooFa.sellTokens(counterval, SellNoOfTokens));
                    }}
                    // new commit
                  >
                    Sell Token
                  </Button>
                </div>
              </div>
            </div>
          </Route>
          <Route path="/subgraph">
            <div className="heading">
              <h1>Burn Tokens</h1>
            </div>
            <div className="card-wrapper">
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"Counter"}
                  value={ctr}
                  onChange={e => {
                    setCtr(e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"Contract Address"}
                  value={cadd}
                  onChange={e => {
                    setCadd(e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: 8 }}>
                <Input
                  style={{ textAlign: "center" }}
                  placeholder={"Token Id"}
                  value={tid}
                  onChange={e => {
                    setTid(e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: 8 }}>
                <Button
                  style={{ width: "100%" }}
                  onClick={async () => {
                    await tx(writeContracts.FooFa.withdraw(ctr, cadd, tid));
                  }}
                >
                  Withdraw
                </Button>
              </div>
            </div>
          </Route>
        </Switch>
      </div>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          {USE_NETWORK_SELECTOR && (
            <div style={{ marginRight: 20 }}>
              <NetworkSwitch
                networkOptions={networkOptions}
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
              />
            </div>
          )}
          <Account
            useBurner={USE_BURNER_WALLET}
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </div>
        {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
          <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
        )}
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
    </div>
  );
}

export default App;
