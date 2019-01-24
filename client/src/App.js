import React, { Component } from "react";
import MarketplaceContract from "./contracts/Marketplace.json";
import getWeb3 from "./utils/getWeb3";
import ipfs from "./ipfs";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';

import "./App.css";

class App extends Component {
  state = { 
    storageValue: 0, 
    web3: null, 
    accounts: null, 
    account: null, 
    contract: null,
    authority: null,
    adminPage: false,
    myStore: false,
    requestList: [],
    product_id: '',
    product_name: '',
    product_desc: '',
    product_img: '',
    product_price: '',
    product_amount: '',
    product_owner: '',
    ownersProduct: [],
    storeList: [],
    storeProduct: [],
    ipfsHash: '' 
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const account = await web3.eth.getCoinbase();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = MarketplaceContract.networks[networkId];
      const instance = new web3.eth.Contract(
        MarketplaceContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ web3, accounts, contract: instance, account }, this.run);

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  run = async () => {
    const { accounts, contract } = this.state;

    await this.getAuthority(this.state.account)
    await this.getDeposit()
    await this.getAllStoreOwner()
    await this.getEthBalance()

  };

  captureFile = (event) => {
    event.preventDefault()
    console.log('capture file..')

    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer : Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }

  }

  onSubmit = (event) => {
    event.preventDefault()

    if(this.state.name == '' || this.state.name == null ||
      this.state.desc == '' || this.state.desc == null ||
      this.state.price == '' || this.state.price == null ||
      this.state.amount == '' || this.state.amount == null ||
      this.state.buffer == ''|| this.state.buffer == null 
    ){
      alert('All input fields are required')
      return false;
    }
    console.log('submit..')

    ipfs.files.add(this.state.buffer, (error, result)=>{
      if(error) {
        console.error(error)
        return
      }
      const contract = this.state.contract;
      let ipfsHash = result[0].hash

      contract.methods.addProductToStore(
        this.state.name, 
        this.state.desc, 
        ipfsHash, 
        this.state.price, 
        this.state.amount
      ).send({ from: this.state.account })
      .then((res)=>{
        alert('success!')
        this.getProductsForOwner()
      })
    })
  }

  getAuthority = () => {
    this.state.contract.methods.getAuth(this.state.account).call().then((authority) => {
      switch (authority) {
        case '0' : 
          authority = 'User'
          break
        case '1' : 
          authority = 'Requested'
          break
        case '2' :
          authority = 'Store Owner'
          break
        case '3' :
          authority = 'Admin'
          break
      }
      this.setState({ authority })
    })
  }

  requestAuth = () => {
    let self = this
    this.state.contract.methods.requestAuth().send({ from : this.state.account })
    .on('transactionHash', function(hash){
        console.log("hash", hash)
    })
    .on('receipt', function(receipt){
        console.log("receipt", receipt)
    })
    .on('error', console.error)
    .on('confirmation', function(confirmationNumber, receipt){
        console.log("receipt", receipt)
    }) 
    .then(function(result){
      console.log(result)
      alert('Sent a request!')
      self.getAuthority()
    })
  }

  onOffAdminPage = () => {
    if(!this.state.adminPage){
      this.getAllRequest()
    }
    this.setState({adminPage: !this.state.adminPage})
  }

  onOffMystore = () => {
    if(!this.state.myStore){
      this.getProductsForOwner()
    }
    this.setState({myStore: !this.state.myStore})
  }

  getAllRequest = () => {
    let self = this
    let methods = this.state.contract.methods
    let temp = []
    methods.requestIndex().call().then((idx) => {
      console.log('idx', idx)
      if(idx){
        for(let i = 1; i <= idx; i++){
          methods.getRequest(i).call().then((address) => {
            methods.getAuth(address).call().then((authority) => {
              temp.push({ address, authority})
              console.log(i)
              if(i == Number(idx)){
                self.setState({ requestList : temp })
              }
            })
          })
        }
      }
    })
  }

  setAuthority = (address) => {
    let self = this
    return () => {
    this.state.contract.methods.getAuth(address).call().then((authority) => {
      if(authority == '1'){
        if(window.confirm('Could you give user permission?')){
          this.state.contract.methods.setAuth(address).send({ from : this.state.account })
          .on('transactionHash', function(hash){
              console.log("hash", hash)
          })
          .on('receipt', function(receipt){
              console.log("receipt", receipt)
          })
          .on('error', console.error)
          .on('confirmation', function(confirmationNumber, receipt){
              console.log("receipt", receipt)
          }) 
          .then(function(result){
            console.log(result)
            alert('success!')
            self.getAllRequest()
          })
        }
      } else if (authority == '2') {
        window.alert('already has authority')
      }
    })
      
    }
  }

  setName = (event) => {
    this.setState({ name: event.target.value })
  }
  setDesc = (event) => {
    this.setState({ desc: event.target.value })
  }
  setPrice = (event) => {
    this.setState({ price: event.target.value })
  }
  setAmount = (event) => {
    this.setState({ amount: event.target.value })
  }

  getProductsForOwner = () => {
    let self = this
    let temp = []
    this.state.contract.methods.productIndex().call().then((idx)=> {
      for(let i = 1; i<=idx; i++){
        self.state.contract.methods.getProduct(i).call()
        .then((result) => {
          temp.push(result)
          if(i == Number(idx)) {
            self.setState({ ownersProduct: temp })
          }
        })
      }
    })
  }

  getDeposit = () => {
    let self = this
    this.state.contract.methods.balanceOf().call({ from: this.state.account }).then((deposit)=> {
      deposit = self.state.web3.utils.fromWei(deposit)
      self.setState({
        deposit
      })
    })
  }

  getAllStoreOwner = () => {
    let self = this
    let methods = this.state.contract.methods
    let temp = []
    methods.requestIndex().call().then((idx) => {
      console.log('idx', idx)
      if(idx){
        for(let i = 1; i <= idx; i++){
          methods.getRequest(i).call().then((address) => {
            methods.getAuth(address).call().then((authority) => {
                if(authority == 2){
                  temp.push({ address, authority})
                }
                if(i == idx){
                  self.setState({ storeList : temp })
                }
            })
          })
        }
      }
    })
  }
  
  goStore = (address) => {
    return () => {
      this.getProductsForUser(address)
    }
  }

  getProductsForUser = (address) => {
    let self = this
    let temp = []
    self.setState({ storeProduct: temp })
    console.log(address)
    this.state.contract.methods.productIndex().call().then((idx)=> {
      for(let i = 1; i<=idx; i++){
        self.state.contract.methods.getProduct(i).call()
        .then((result) => {
          if(result[6] == address){
            temp.push(result)
          }
          if(i == Number(idx)) {
            self.setState({ storeProduct: temp })
          }
        })
      }
    })
  }

  setBuyAmount = (event) => {
    this.setState({ buyAmount: event.target.value })
  }

  buyProduct = (pid, price, address) => {
    let self = this
    return () => {
      let totalValue = this.state.web3.utils.toWei(price, 'ether') * this.state.buyAmount
      this.state.contract.methods.buy(pid, this.state.buyAmount)
      .send({ from: this.state.account, value: totalValue })
      .on('transactionHash', function(hash){
        console.log("hash", hash)
      })
      .on('receipt', function(receipt){
        console.log("receipt", receipt)
      })
      .on('error', console.error)
      .on('confirmation', function(confirmationNumber, receipt){
        console.log("receipt", receipt)
      }) 
      .then(function(result){
        console.log(result)
        alert('success!')
        self.getProductsForUser(address)
        self.getEthBalance()
        self.getDeposit()
      })
    }
  }

  getEthBalance = () => {
    let self = this
    this.state.web3.eth.getBalance(this.state.account).then((ethBalance) => {
      ethBalance = self.state.web3.utils.fromWei(ethBalance)
      this.setState({
        ethBalance
      })
    })
  }

  withdraw = () => {
    let self = this
    this.state.contract.methods.withdraw()
    .send({ from: this.state.account,
      gas: 4700000,
      gasPrice: 8000000000
    })
    .on('transactionHash', function(hash){
      console.log("hash", hash)
    })
    .on('receipt', function(receipt){
        console.log("receipt", receipt)
    })
    .on('error', console.error)
    .on('confirmation', function(confirmationNumber, receipt){
        console.log("receipt", receipt)
    }) 
    .then(function(result){
      console.log(result)
      alert('success!')
      self.getEthBalance()
      self.getDeposit()
    })
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    let btn 
    switch (this.state.authority) {
      case 'Admin' : 
        btn = <Button onClick={this.onOffAdminPage} color="primary">Admin page on/off</Button>
        break
      case 'Store Owner' : 
        btn = <Button onClick={this.onOffMystore} color="primary">Open My store</Button>
        break
      case 'User' :
        btn = <Button onClick={this.requestAuth} color="primary">Request</Button>
        break
      case 'Requested' :
        btn = <Button>already Requested</Button>
        break
    }

    let style = {
      textAlign: 'left'
    }

    let imgStyle = {
      width: '200px'
    }

    let liStyle = {
      border: '1px solid'
    }

    return (
      <div className="App">
        <h1>
          Marketplace system on ethereum
        </h1>
        <img src="https://consensys.net/academy/wp-content/uploads/2017/08/blue_poly.png" className="dHjWGu" />
        <div>
          <h2>Your account is {this.state.account}</h2>
          <h2>Your authority is {this.state.authority}</h2>
          <h2>Your balance of eth is {this.state.ethBalance}</h2>
          <h2>Your deposit on contract is {this.state.deposit} <Button color="secondary" onClick={this.withdraw}>withdraw</Button></h2>
          {btn}
        </div>

        { this.state.adminPage ?
          <List component="nav">
            <p>Click address to give user authority</p>
            {this.state.requestList.map((item, i)=>{
              switch (item.authority) {
                case '1' : 
                  item.authority = 'request'
                  break
                case '2' : 
                  item.authority = 'store owner'
                  break
              }
              return <ListItem button key={i} onClick={this.setAuthority(item.address)}>
                <ListItemText inset primary={item.address} secondary={item.authority} />
              </ListItem>
              }
            )}
          </List> :
          false
        }

        { this.state.myStore ?
          <div style={style}>
            <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" />
            <form onSubmit={this.onSubmit}>
              <input type="text" placeholder="Title" onChange={this.setName}/>
              <input type="text" placeholder="Description" onChange={this.setDesc}/>
              <input type="number" placeholder="Price" onChange={this.setPrice}/>
              <input type="number" placeholder="Amount" onChange={this.setAmount}/>
              <input type="file" onChange={this.captureFile} accept="image/*"/>
              <input type="submit"/>
            </form>
            <p>Your Image is stored on IPFS.</p>

            <ul>
            {
              this.state.ownersProduct.map((item, i) => 
                <li key={i}>
                  <img src={'https://ipfs.io/ipfs/'+item[3]} style={imgStyle}/>
                  <p>title : {item[1]}</p>
                  <p>desc : {item[2]}</p>
                  <p>price : {item[4]}</p>
                  <p>amount : {item[5]}</p>
                </li>
              )
            }
            </ul>
          </div> : false
        }

        <List component="nav">
          <p>Click address to go to store</p>
          {this.state.storeList.map((item, i)=>{
            return <ListItem button key={i} onClick={this.goStore(item.address)}>
              <ListItemText inset primary={item.address} secondary={'Store '+i} />
            </ListItem>
          }
          )}
        </List>

        <div style={style}>
          <ul>
            {
              this.state.storeProduct.map((item, i) => 
                <li key={i} style={liStyle}>
                  <img src={'https://ipfs.io/ipfs/'+item[3]} style={imgStyle}/>
                  <p>title : {item[1]}</p>
                  <p>desc : {item[2]}</p>
                  <p>price : {item[4]}</p>
                  <p>amount : {item[5]}</p>
                  <input type="number" placeholder="amount" onChange={this.setBuyAmount} />
                  <Button color="secondary" onClick={this.buyProduct(item[0], item[4], item[6])}>Buy</Button>
                </li>
              )
            }
          </ul>
        </div>

      </div>
    );
  }
}

export default App;
