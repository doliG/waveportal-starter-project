import { ethers } from "ethers"
import * as React from "react"
import { useState } from "react"
import { useEffect } from "react"
import { Grid } from "react-loader-spinner"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "./App.css"
import contractABI from "./utils/WavePortal.abi.json"

dayjs.extend(relativeTime)

const contractAddress = "0x59FcF27A2C83e0382fC0b93C9ED6C301B5a5ff42" // on rinkeby
const formatAddress = addr =>
  addr.substring(0, 5) + "..." + addr.substring(38, 42)

export default function App() {
  const [wallet, setWallet] = useState()
  const [waveCount, setWaveCount] = useState()
  const [waves, setWaves] = useState([])
  const [status, setStatus] = useState("ready") // 'ready' -> 'approving' -> 'mining' -> 'ready' || 'error'
  const [message, setMessage] = useState("hey yome, I love you!")

  const wave = async () => {
    try {
      const { ethereum } = window
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      )

      setStatus("approving")
      const waveTxn = await contract.wave(message)

      setStatus("mining")
      console.log("Mining...", waveTxn.hash)
      await waveTxn.wait()

      setStatus("ready")
      console.log("Mined -- ", waveTxn.hash)

      const count = await contract.getTotalWaves()
      console.log("Retrieved total wave count...", count.toNumber(), count)
      setWaveCount(count.toNumber())
    } catch (e) {
      console.error(e)
      setStatus("ready")
    }
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

      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      )

      let count = await contract.getTotalWaves()
      console.log("Retrieved total wave count...", count.toNumber(), count)
      setWaveCount(count.toNumber())
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    async function getAllWaves() {
      const { ethereum } = window
      if (!ethereum) {
        return console.error("Make sure you have metamask!")
      }

      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      )

      const waves = await wavePortalContract.getAllWaves()
      console.debug(waves)

      const formatted = waves.map(w => ({
        ...w,
        date: new Date(w.date * 1000),
      }))

      console.debug(formatted)
      setWaves(formatted)
    }

    getAllWaves()
  }, [])

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
        <h1 className="">
          <span className="nes-text is-primary">#</span> Hello 🚀
        </h1>

        <div className="">
          I am <span className="nes-text is-primary">yome</span> and I worked on
          web2 so that's pretty cool right? Connect your Ethereum wallet and
          wave at me!
        </div>

        {wallet ? (
          <div className="nes-badge login">
            <span className="is-dark">{formatAddress(wallet)}</span>
          </div>
        ) : (
          <button className="nes-btn login" onClick={connectWallet}>
            Connect wallet
          </button>
        )}

        {wallet && (
          <div>
            <br />
            <label>Your message</label>
            <textarea
              className="nes-textarea"
              onChange={e => setMessage(e.target.value)}
            >
              {message}
            </textarea>
            <button
              className={`nes-btn ${status === "ready" && "is-primary"}`}
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
          </div>
        )}

        <br />
        <br />
        <h3 className="bio">
          <span className="nes-text is-primary">#</span> They already waved (
          {waveCount})
        </h3>

        {waves.map((wave, index) => (
          <div key={index} className="nes-container with-title is-rounded wave">
            <p class="title">
              <span title={wave.waver}>{formatAddress(wave.waver)}</span>{" "}
              <span title={wave.date}>{dayjs(wave.date).fromNow()}</span>
            </p>
            <p>{wave.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
