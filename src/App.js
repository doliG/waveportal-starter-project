import { ethers } from "ethers"
import * as React from "react"
import { useState } from "react"
import { useEffect } from "react"
import { Grid } from "react-loader-spinner"
// import { ethers } from "ethers";
import "./App.css"
import contractABI from "./utils/WavePortal.abi.json"

const contractAddress = "0xd5f08a0ae197482FA808cE84E00E97d940dBD26E" // on rinkeby

export default function App() {
  const [wallet, setWallet] = useState()
  const [waveCount, setWaveCount] = useState()
  const [status, setStatus] = useState("ready") // 'ready' -> 'approving' -> 'mining' -> 'ready' || 'error'

  const wave = async () => {
    const { ethereum } = window
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      contractAddress,
      contractABI.abi,
      signer
    )

    let count = await contract.getTotalWaves()
    setWaveCount(count.toNumber())
    console.log("Retrieved total wave count...", count.toNumber(), count)

    setStatus("approving")
    const waveTxn = await contract.wave()

    setStatus("mining")
    console.log("Mining...", waveTxn.hash)
    await waveTxn.wait()

    setStatus("ready")
    console.log("Mined -- ", waveTxn.hash)

    count = await contract.getTotalWaves()
    console.log("Retrieved total wave count...", count.toNumber(), count)
    setWaveCount(count.toNumber())
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        return alert("Please install metamask!")
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      console.log("Connected", accounts[0])
      setWallet(accounts[0])
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    async function connect() {
      const { ethereum } = window
      if (!ethereum) {
        return console.error("Make sure you have metamask!")
      }

      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (!accounts.length !== 0) {
        return console.error("No authorized account found")
      }
      const account = accounts[0]
      console.log("Found an authorized account:", account)
      setWallet(account)
    }
    connect()
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">Hey there!</div>

        <div className="bio">
          I am farza and I worked on self-driving cars so that's pretty cool
          right? Connect your Ethereum wallet and wave at me!
        </div>

        {wallet ? (
          <pre>Connected with address {JSON.stringify(wallet, null, 2)}</pre>
        ) : (
          <button className="waveButton" onClick={connectWallet}>
            Connect wallet
          </button>
        )}

        {wallet && (
          <button
            className="waveButton"
            onClick={wave}
            disabled={status !== "ready"}
          >
            {status === "ready" && "Wave at Me"}
            {status === "approving" && "⚠️ Waiting for your approval..."}
            {status === "mining" && (
              <div className="loading">
                <Grid
                  height="1rem"
                  width="1.5rem"
                  color="black"
                  ariaLabel="loading-indicator"
                />
                Waiting tx to complete...
              </div>
            )}
          </button>
        )}

        <div className="bio">Total waves: {waveCount}</div>
      </div>
    </div>
  )
}
