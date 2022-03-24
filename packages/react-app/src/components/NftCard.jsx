import React from "react";
import "./Nftcard.css";
const NftCard = ({ img, setSelectedNft, selectedNft }) => {
  console.log(selectedNft === img);
  return (
    <div
      className={`card ${
        selectedNft?.token_id === img?.token_id && selectedNft?.contract_address === img?.contract_address
          ? "selected"
          : ""
      }`}
      onClick={() => setSelectedNft(img)}
    >
      <img src={img.image_url} alt={img.name} srcset="" />
      <div className="details">
        <h2 className="name">{img.name}</h2>
        <div>Token ID: {img.token_id}</div>
        <div>Token Balance: {img.token_balance}</div>
        {img?.price && <div>{img.price} MATIC</div>}
      </div>
    </div>
  );
};

export default NftCard;
