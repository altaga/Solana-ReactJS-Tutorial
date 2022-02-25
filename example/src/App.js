import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as solanaWeb3 from '@solana/web3.js';
var Buffer = require('buffer/').Buffer

const programId = "Eyuv3eDxGvmxJ4ZeeeRFCNkJUWyEXANikiquAuzp3Um3";

const connection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl('devnet'),
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connect: false,
      balance: 0,
      data: "",
      disabled: false
    }
    this.connect = this.connect.bind(this);
    this.program = this.program.bind(this);
  }

  async program() {
    let memoPublicKey = new solanaWeb3.PublicKey(programId)
    const instruction = new solanaWeb3.TransactionInstruction({
      keys: [],
      programId: memoPublicKey,
      data: Buffer.from(this.state.data),
    });

    var transaction = new solanaWeb3.Transaction().add(instruction);

    // Setting the variables for the transaction
    transaction.feePayer = await window.solana.publicKey;
    let blockhashObj = await connection.getRecentBlockhash();
    transaction.recentBlockhash = await blockhashObj.blockhash;
    window.solana.signAndSendTransaction(transaction)
      .then(async (result) => {
        let { signature } = result
        await connection.confirmTransaction(signature);
        console.log(signature)
      })
      .catch(error => {
        console.log(error)
      })
  }

  async connect() {
    if ("solana" in window) {
      if (window.solana.isPhantom) {
        await window.solana.connect();
        const balance = await connection.getBalance(window.solana.publicKey);
        this.setState({
          connect: true,
          balance: balance / solanaWeb3.LAMPORTS_PER_SOL
        });
      }
    } else {
      window.open("https://www.phantom.app/", "_blank");
    }
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
                          let balance = await connection.getBalance(window.solana.publicKey);
                          console.log("Balance: ", balance / solanaWeb3.LAMPORTS_PER_SOL)
                          const result = await connection.requestAirdrop(
                            window.solana.publicKey,
                            1 * solanaWeb3.LAMPORTS_PER_SOL,
                          );
                          await connection.confirmTransaction(result); // wait for confirmation
                          balance = await connection.getBalance(window.solana.publicKey);
                          this.setState({
                            balance: balance / solanaWeb3.LAMPORTS_PER_SOL,
                            disabled: false
                          }, () => {
                            document.getElementById("submit").disabled = false;
                            console.log("Balance: ", balance / solanaWeb3.LAMPORTS_PER_SOL)
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