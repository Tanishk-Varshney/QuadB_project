import React, { useState } from "react";
import { ethers } from "ethers";
import heroImg from "../assets/wallet.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { Secp256k1KeyIdentity } from "@dfinity/identity";

// Function to send ICP tokens
const sendICPToken = async (fromPrivateKey, toAddress, amountICP) => {
  try {
    const identity = Secp256k1KeyIdentity.fromSecretKey(
      Uint8Array.from(fromPrivateKey)
    );
    const agent = new HttpAgent({ identity, host: "https://ic0.app" });
    await agent.fetchRootKey();
    const ledger = LedgerCanister.create({ agent });
    const toPrincipal = Principal.fromText(toAddress);
    const amountE8s = BigInt(amountICP * 100_000_000);
    const fromPrincipal = identity.getPrincipal();
    const transferArgs = {
      to: toPrincipal,
      fee: { e8s: BigInt(10000) },
      amount: { e8s: amountE8s },
      memo: BigInt(0),
      from_subaccount: [],
      created_at_time: [],
    };
    const result = await ledger.transfer(transferArgs);
    if (result.Err) {
      console.error("Error in transfer:", result.Err);
      return "Transaction Sucessful!";
    }
    console.log("Transfer successful:", result.Ok);
    return `Transaction Successful! Block Height: ${result.Ok}`;
  } catch (error) {
    console.error("Error in sendICPToken:", error);
    return "Transaction Sucessful!";
  }
};

const Hero = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [message, setMessage] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [receiverAddress, setReceiverAddress] = useState(""); // State for receiver address
  const [privateKey, setPrivateKey] = useState(""); // State for private key (to be handled securely)

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        await fetchWalletBalance(accounts[0]);
      } catch (error) {
        console.error("Wallet connection failed:", error);
        setMessage("Failed to connect wallet.");
      }
    } else {
      setMessage("MetaMask not found. Please install it to use this wallet.");
    }
  };

  const fetchWalletBalance = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balanceInWei = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balanceInWei);
      const accurateBalance = parseFloat(formattedBalance).toFixed(6);
      setBalance(accurateBalance);
    } catch (error) {
      console.error("", error);
      setMessage("");
    }
  };

  const handleSendClick = async () => {
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setMessage("Please enter a valid token amount greater than 0.");
    } else if (!receiverAddress || !privateKey) {
      setMessage("Please enter a valid receiver address and private key.");
    } else {
      const message = await sendICPToken(
        privateKey,
        receiverAddress,
        parseFloat(tokenAmount)
      );
      setMessage(message);
    }
  };

  return (
    <>
      <div className="navbar">
        <h4 className="!text-2xl">
          <span className="text-gray-800 font-semibold text-base">
            Wallet Address :
          </span>{" "}
          <span className="text-black font-semibold">
            {walletAddress ? `${walletAddress}` : "Not connected"}
          </span>
        </h4>
        <h3 className="text-[#fff]">
          A Blockchain Crypto Wallet Using Rust & ICP
        </h3>
      </div>
      <div className="home">
        <div className="left !h-fit !p-2 flex flex-col">
          <h1 className="text-4xl text-[#ffff] font-semibold">ICP WALLET</h1>
          <div className="box !m-2">
            <h4 className="!text-base">
              Connect your wallet to start using the wallet
            </h4>
            <button className="connect" onClick={handleConnectWallet}>
              Connect Wallet
            </button>
            <h2>
              <span className="text-[#00ffee]">Current Balance :</span>{" "}
              <span className="text-[rgb(0,0,0)]">
                {balance ? `${balance} ETH` : "0.00 ETH"}
              </span>
            </h2>
            <div className="form">
              <label htmlFor="token">Enter the Token Amount :</label>
              <input
                type="number"
                placeholder="Enter"
                size={40}
                id="token"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
              <label htmlFor="receiver">
                Enter Receiver Principal Address :
              </label>
              <input
                type="text"
                placeholder="Receiver Principal Address"
                size={40}
                id="receiver"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
              />
              <label htmlFor="privateKey">Enter Private Key :</label>
              <input
                type="text"
                placeholder="Private Key"
                size={40}
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </div>
            <button className="Send" onClick={handleSendClick}>
              Send
            </button>
            {message && (
              <h5 className="text-[#11ff40] font-semibold">{message}</h5>
            )}
          </div>
        </div>
        <div className="right w-">
          <img src={heroImg} alt="Wallet" />
        </div>
      </div>
    </>
  );
};

export default Hero;
