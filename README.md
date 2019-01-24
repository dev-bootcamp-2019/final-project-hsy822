---
Title:  Marketplace system on ethereum
Author: Sooyoung Hyun
Date:   January 2019
Mail:   hyunsy822@gmail.com
File:   README
---

Consensys Academy's 2018 Dev Program Final Project
===

## Index

- [What does this project do?](#what-does-this-project-do)
- [How to set it up?](#how-to-set-it-up)
- [How to use this DAPP?](#how-to-use-this-dapp)

## What does this project do?

This project is an online marketplace that operates on the blockchain.

There are a list of stores on a central marketplace where shoppers can purchase goods posted by the store owners.

The central marketplace is managed by adminstrator. Admin allow store owners to add stores to the marketplace. Store owners can manage their store's products and funds. Shoppers can visit stores and purchase goos that are in stock using ether.

All informations are saved in blockchain and the picture of products is saved on IPFS.

## How to set it up?

Clone this repository.
```
$ git clone https://github.com/dev-bootcamp-2019/final-project-hsy822
$ cd consensys-project/
```
Go to the repository folder.
```
$ cd client/
$ npm install
$ cd ..
``` 
In this project, zepplein package installed already so that you can find a folder: `installed_contracts` 

Start Ganache-cli.
```
$ ganache-cli
``` 

Open a new terminal and go to project folder. Compile and migrate smart contract. 
```
$ cd consensys-project/
$ truffle compile
$ truffle migrate --reset
```

Open a new terminal and go to client folder. You can start server. 
```
$ cd consensys-project/
$ cd client/
$ npm run start
```

Go to [http//localhost:3000](http://localhost:3000/) 

---

## How to use this DApp?
* Account deployed contract is Admin.(ex: accounts[0])
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s1.PNG)

* Connect with another user account.(ex: accounts[1])
* Click the REQUEST button to get 'Store Owner' permission.
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s2.PNG)

* When you send a request, the state value changes.(User -> Requested)
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s3.PNG)

* Connect with admin account.(ex: accounts[0]) 
* Click the ADMIN PAGE ONOFF button to get request list. 
* You can give the user permissions by clicking on the address.
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s4.PNG)

* Connect with user account.(ex: accounts[1])  
* The state value is changed from 'Requested' to 'Store owner'.
* Click the OPEN MY STORE button to add product.
* The uploaded photo file is stored on IPFS.  
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s5.PNG)

* Connect with another user account.(ex: accounts[2]) 
* You can see store list. Click on the address to view the list of products in that store.
* If you enter the amount(ex: 5) and click the BUY button, the balance of ether is decreased.
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s6.PNG)

* Connect with Store Owner account.(ex: accounts[1])
* You can see that there is a deposit of 50 in the contract. 
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s7.PNG)

* When you click the WITHDRAW button, the ether is withdrawn from the contract to the store owner account.
![Alt text](https://github.com/dev-bootcamp-2019/final-project-hsy822/blob/master/screenshot/s8.PNG)

* In fact, more specific features need to be implemented in addition, but not all. In order to upgrade, functions such as product inventory management and order management should be added.
---
