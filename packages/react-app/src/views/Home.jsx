import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import { useState } from "react";
import axios from "axios";
import { useBalance, useContractLoader, useGasPrice, useOnBlock, useUserProviderAndSigner } from "eth-hooks";
import LocaleProvider from "antd/lib/locale-provider";
import NftCard from "../components/NftCard";
import "./styles.css";
import { Button } from "antd";
/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react component
 */
function Home({
  yourLocalBalance,
  readContracts,
  address,
  writeContracts,
  localProvider,
  imgs,
  setImgs,
  setSelectedNft,
  selectedNft,
  userSigner,
}) {
  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract
  const purpose = useContractReader(readContracts, "YourContract", "purpose");

  useEffect(() => {
    const url = `https://api.covalenthq.com/v1/80001/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=true&no-nft-fetch=false&key=ckey_1d7288b1bd29481ba9c8415d038`;
    const fun = async () => {
      let data = [];
      let images = [];
      try {
        data = await axios.get(url);
        for (const item of data?.data?.data?.items) {
          console.log(item);
          if (item?.supports_erc?.includes("erc1155") && item?.nft_data !== null) {
            for (const nft of item.nft_data) {
              const img_data = await axios.get(nft.token_url);
              console.log(img_data);
              images.push({
                token_id: nft.token_id,
                token_balance: nft.token_balance,
                name: img_data.data.name,
                image_url: img_data.data.image,
                contract_address: item.contract_address,
              });
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
      setImgs(images);

      // sample push

      // console.log('DEBUG')
      // data?.data?.data?.items?.forEach(item => {
      //   if(item?.supports_erc?.includes('erc1155') && item?.nft_data!== null){
      //     item.nft_data.forEach(nft => {
      //       console.log(nft.token_id)
      //       console.log(nft.token_balance)
      //       console.log(nft.token_url);
      //       axios.get(nft.token_url)
      //       .then(res => {
      //         setImgs([...imgs, {
      //           token_id: nft.token_id,
      //           token_balance: nft.token_balance,
      //           name: res.data.name,
      //           image_url: res.data.image,
      //           contract_address: item.contract_address
      //         }])
      //       })
      //       .catch(err => console.log(err))
      //     })
      //   }
      // })
    };
    fun();
  }, [address, selectedNft]);

  // const NFTAddress = item.contract_address;
  // console.log(NFTAddress);

  return (
    <div className="wrapper">
      {imgs.map((img, idx) => (
        <NftCard selectedNft={selectedNft} key={idx} setSelectedNft={setSelectedNft} img={img} />
      ))}
    </div>
    // <div>
    //   <div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>📝</span>
    //     This Is Your App Home. You can start editing it in{" "}
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       packages/react-app/src/views/Home.jsx
    //     </span>
    //   </div>
    //   <div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>✏️</span>
    //     Edit your smart contract {" "}
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       YourContract.sol
    //     </span>{" "}in{" "}
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       packages/hardhat/contracts
    //     </span>
    //   </div>
    //   {!purpose?<div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>👷‍♀️</span>
    //     You haven't deployed your contract yet, run
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       yarn chain
    //     </span> and <span
    //         className="highlight"
    //         style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //       >
    //         yarn deploy
    //       </span> to deploy your first contract!
    //   </div>:<div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>🤓</span>
    //     The "purpose" variable from your contract is{" "}
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       {purpose}
    //     </span>
    //   </div>}

    //   <div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>🤖</span>
    //     An example prop of your balance{" "}
    //     <span style={{ fontWeight: "bold", color: "green" }}>({ethers.utils.formatEther(yourLocalBalance)})</span> was
    //     passed into the
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       Home.jsx
    //     </span>{" "}
    //     component from
    //     <span
    //       className="highlight"
    //       style={{ marginLeft: 4, /* backgroundColor: "#f9f9f9", */ padding: 4, borderRadius: 4, fontWeight: "bolder" }}
    //     >
    //       App.jsx
    //     </span>
    //   </div>
    //   <div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>💭</span>
    //     Check out the <Link to="/hints">"Hints"</Link> tab for more tips.
    //   </div>
    //   <div style={{ margin: 32 }}>
    //     <span style={{ marginRight: 8 }}>🛠</span>
    //     Tinker with your smart contract using the <Link to="/debug">"Debug Contract"</Link> tab.
    //   </div>
    // </div>
  );
}

export default Home;
