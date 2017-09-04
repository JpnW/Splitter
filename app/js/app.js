import React from 'react';
import {render} from 'react-dom';
import Web3 from 'web3';
import Promise from 'bluebird';
import truffleContract from "truffle-contract";
import splitterJson from "../../build/contracts/Splitter.json";


class App extends React.Component{
	constructor(props){
		super(props);
		this.preparation();
		this.state = {
			Alice: {address: '', balance: 'N/A'},
			Bob: {address: '', balance: 'N/A'},
			Carol: {address: '', balance: 'N/A'},
			processing: false,
			amount: null,
			status: '',
		}
	}

	preparation(){
		if (typeof web3 !== 'undefined') {
    // Use the Mist/wallet/Metamask provider.
	    window.web3 = new Web3(web3.currentProvider);
		} else {
		    // Your preferred fallback.
		    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 
		}
		Promise.promisifyAll(web3.eth, { suffix: "Promise" });
		Promise.promisifyAll(web3.version, { suffix: "Promise" });
		this.Splitter = truffleContract(splitterJson);
		this.Splitter.setProvider(web3.currentProvider);
	}

	getBalances(arr){
		return Promise
			.map(arr, address => {
				return web3.eth.getBalancePromise(address);
			})
			.then(resultArr => {
				const result = {};
				arr.forEach((address, i) => {
					result[address] = resultArr[i].toString(10);
				})
				return result;
			})
	}

 setBalances(accounts, balanceTable){
 	this.setState(prevState =>{
						return {
							Alice: {...prevState.Alice, address: accounts[0], balance: balanceTable[accounts[0]]},
							Bob: {...prevState.Bob, address: accounts[1], balance: balanceTable[accounts[1]]},
							Carol: {...prevState.Carol, address: accounts[2], balance: balanceTable[accounts[2]]}
						}
					})
 }

	componentDidMount(){
		// let accounts;
			return web3.eth.getAccountsPromise()
				.then(_accounts =>{
					this.accounts = _accounts;
					if (this.accounts.length < 3){
						console.log('no enough accounts');
					}

					return this.getBalances(this.accounts);
				})
				.then(balanceTable => {
						this.setBalances(this.accounts, balanceTable)
				})
				.catch(error =>{
					alert(error)
				})
	}

	send(){
		const {amount, Alice, Bob, Carol} = this.state;
		this.setState({processing: true})
		let deployed;
		return this.Splitter.deployed()
			.then(_deployed =>{
				return _deployed.splitBalance.sendTransaction(
							Bob.address,
							Carol.address,
							{from: Alice.address, value: amount}
					)
			})
			.then(txHash =>{
				this.setState({status: "Transaction on the way " + txHash})
				const tryAgain = () => web3.eth.getTransactionReceiptPromise(txHash)
                .then(receipt => {
                	if(receipt){
                		return receipt
                	} 
                  
                  // Let's hope we don't hit the max call stack depth
                  return Promise
	                    .delay(500)
	                    .then(tryAgain)
                });
        
        return tryAgain();
			})
			.then(receipt =>{
				 if (receipt.logs.length == 0) {
                console.error("Empty logs");
                console.error(receipt);
                this.setState({status: "There was an error in the tx execution"})
            } else {
                // Format the event nicely.
                // console.log(deployed.Transfer().formatter(receipt.logs[0]).args);
                this.getBalances(this.accounts)
                .then((balanceTable)=>{
                	this.setBalances(this.accounts, balanceTable)
                })
                this.setState({status: "Transfer executed", processing: false})
            }

			})
			.catch(e => {
					this.setState({status: e.toString()})
            console.error(e);
        });



	}

	inputOnChange(e){
		this.setState({
			amount: e.target.value
		})
	}



	render(){
		const {Alice, Bob, Carol, processing} = this.state;
		return (
			<div>
				<h1>Splitter</h1>
			 	<div>
			 		<span>Alice</span>
			 		<span> balance: <strong>{Alice.balance} </strong> wei </span>
			 		<input type='number' min='1' placeholder='wei' onChange={this.inputOnChange.bind(this)}/>
			 		{processing ? 
			 			<button disabled>sending</button> :
			 			<button onClick={this.send.bind(this)}>send</button>
			 		}
			 	</div>

			 	<div>
			 		<span>Bob</span> 
			 		<span> balance: <strong>{Bob.balance} </strong> wei </span>

			 	</div>
			 	<div>
			 		<span>Carol</span>
			 		<span> balance: <strong>{Carol.balance} </strong> wei </span>
			 	</div>
			 	<div>
			 		{this.state.status}
			 	</div>
			</div>
			 
			 
		)
	}
}

render(<App/>, document.getElementById('app'))

