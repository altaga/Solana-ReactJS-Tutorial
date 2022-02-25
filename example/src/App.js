// Basic Imports

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// Solana Web3 Module
import * as solanaWeb3 from '@solana/web3.js';

// Buffer Module
var Buffer = require('buffer/').Buffer

// Program Address (devnet)
const programId = "Eyuv3eDxGvmxJ4ZeeeRFCNkJUWyEXANikiquAuzp3Um3";

// Solana Cluster RPC (devnet)

const connection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl('devnet'),
);

class App extends Component {
  constructor(props) {
    super(props);
    // Setting the state of the app
    this.state = {
      connect: false,
      balance: 0,
      data: "",
      disabled: false
    }
    // Binding the functions to the class
    this.connect = this.connect.bind(this);
    this.program = this.program.bind(this);
    this.airdrop = this.airdrop.bind(this);
  }

  // Connecting to the Phantom Wallet and getting the balance

  async connect() {
    // Check if the wallet extension is installed
    if ("solana" in window) {
      // Check if the wallet is Phantom Wallet
      if (window.solana.isPhantom) {
        // Connect to the wallet
        await window.solana.connect();
        // Get the balance
        const balance = await connection.getBalance(window.solana.publicKey);
        // Update the state of the app
        this.setState({
          connect: true,
          balance: balance / solanaWeb3.LAMPORTS_PER_SOL
        });
      }
    } else {
      // If the wallet extension is not installed redirect to the download page
      window.open("https://www.phantom.app/", "_blank");
    }
  }

  // Send the transaction to the program and update the state

  async program() {
    // Convert address to Public Key Object
    let memoPublicKey = new solanaWeb3.PublicKey(programId)
    // Create a new Instruction
    const instruction = new solanaWeb3.TransactionInstruction({
      keys: [],
      programId: memoPublicKey,
      data: Buffer.from(this.state.data),
    });
    // Create a new Transaction object with the Instruction, add any other instructions here
    var transaction = new solanaWeb3.Transaction().add(instruction);

    // Setup our address to pay the fee
    transaction.feePayer = await window.solana.publicKey;
    let blockhashObj = await connection.getRecentBlockhash();
    transaction.recentBlockhash = await blockhashObj.blockhash;
    // Sign the transaction
    window.solana.signAndSendTransaction(transaction)
      .then(async (result) => {
        let { signature } = result
        // wait for transaction to be confirmed
        await connection.confirmTransaction(signature);
        // print the transaction receipt
        console.log(signature)
      })
      .catch(error => {
        // print the error
        console.log(error)
      })
  }

  // Airdrop function (only for testing)
  
  async airdrop() {
    // Get the balance of the address
    let balance = await connection.getBalance(window.solana.publicKey);
    // Print the balance
    console.log("Balance: ", balance / solanaWeb3.LAMPORTS_PER_SOL)
    // Request air drop
    const result = await connection.requestAirdrop(
      window.solana.publicKey,
      1 * solanaWeb3.LAMPORTS_PER_SOL,
    );
    // Await the transaction to be confirmed
    await connection.confirmTransaction(result); // wait for confirmation
    // Get the new balance of the address
    balance = await connection.getBalance(window.solana.publicKey);
    // Print the new balance
    console.log("Balance: ", balance / solanaWeb3.LAMPORTS_PER_SOL)
    // return the new balance
    return balance
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <div>
            <button
              onClick={
                () => this.connect()
              }
              style={{
                backgroundColor: "#61dafb",
                border: "none",
                borderRadius: "12px",
                color: "black",
                padding: "20px",
                textAlign: "center",
                textDecoration: "none",
                display: "inline-block",
                fontSize: "2rem",
                margin: "4px 2px",
                cursor: "pointer"
              }}>
              {
                "solana" in window ?
                  (
                    this.state.connect ?
                      "Wallet Connected"
                      :
                      "Connect Wallet"
                  )
                  :
                  "Install Wallet"
              }
            </button>
            <div>
              Address: {" "}
              {
                this.state.connect &&
                <a href={`https://explorer.solana.com/address/${window.solana.publicKey.toString("hex")}?cluster=devnet`} rel="noopener noreferrer" target="_blank">
                  {
                    window.solana.publicKey.toString("hex")
                  }
                </a>
              }
            </div>
            <div>
              Contract: {" "}
              {
                this.state.connect &&
                <a href={`https://explorer.solana.com/address/${programId}?cluster=devnet`} rel="noopener noreferrer" target="_blank">
                  {
                    programId
                  }
                </a>
              }
            </div>
            <div>
              Balance: {" "}
              {
                this.state.connect &&
                <>
                  {
                    this.state.balance + " SOL"
                  }
                </>
              }
            </div>
            <hr></hr>
            <div>
              {
                this.state.connect &&
                <>
                  Data:{" "}
                  <input style={{
                    width: "500px",
                    fontSize: "2rem",
                  }}
                    onChange={
                      (e) => this.setState({
                        data: e.target.value
                      })
                    }
                  />
                  <p />
                  <button
                    id="submit"
                    style={{
                      backgroundColor: "#9945FF",
                      border: "none",
                      borderRadius: "12px",
                      color: "black",
                      padding: "20px",
                      textAlign: "center",
                      textDecoration: "none",
                      display: "inline-block",
                      fontSize: "2rem",
                      cursor: "pointer",
                    }}
                    onClick={
                      async () => {
                        this.setState({
                          disabled: true
                        })
                        if (this.state.balance <= 0) {
                          document.getElementById("submit").disabled = true;
                          const balance = await this.airdrop();
                          this.setState({
                            balance: balance / solanaWeb3.LAMPORTS_PER_SOL,
                            disabled: false
                          }, () => {
                            document.getElementById("submit").disabled = false;
                          });
                        }
                        else {
                          document.getElementById("submit").disabled = true;
                          await this.program()
                          const balance = await connection.getBalance(window.solana.publicKey);
                          this.setState({
                            balance: balance / solanaWeb3.LAMPORTS_PER_SOL,
                            disabled: false
                          }, () => {
                            document.getElementById("submit").disabled = false;
                          });
                        }
                      }}>
                    {
                      this.state.balance > 0 ?
                        this.state.disabled ? "Sending..." : "Send"
                        :
                        this.state.disabled ? "Airdropping..." : "Airdrop 1 SOL"
                    }
                  </button>
                </>
              }
            </div>
          </div>
        </header>
      </div>
    );
  }
}

export default App;