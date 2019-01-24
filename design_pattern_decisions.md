---
Title:  Marketplace system on ethereum
Author: Sooyoung Hyun
Date:   January 2019
Mail:   hyunsy822@gmail.com
File:   Design Patterns Decisions
---

Design Patterns Decisions
===

## Index

- [Contract structure](#contract-structure)
	- [Modifiers](#modifiers)
	- [Circuit Breaker](#circuit-breaker)
	- [EthPM](#EthPM)

## Contract structure

```
contracts
|___Marketplace.sol
|
installed_contracts
|___zeppelin
		|___contracts
				|___math
				|	  |___SafeMath.sol
				|___ownership
					  	|___Ownable.sol
```

### Modifiers

Use Modifiers to control access to specific functions for each user. It is used to control emergency situations and to protect against reentrant attacks.

```
modifier nonReentrancy() {  
	require(!reentrancyLock, "reentrancyLocked!");
	reentrancyLock = true;
	_;
	reentrancyLock = false;
}

modifier noEmergency {
	require(!stopped, "Emergency stop!");
	_;
}

modifier isStoreOwner {
	require(
		auth[msg.sender] == Auth.StoreOwner || auth[msg.sender] == Auth.Admin, 
		"authority should be store owner"
	);
	_;
}
```

### Circuit Breaker

This smart contract contains ether, which gives the hacker an attack. 
Also, when a problem is found in the code, it is impossible to fix it, so a way that can control the function of the contract is needed.

### EthPM

Installed the Zeppelin package with EthPM
```
$ truffle install zeppelin
```
This adds the Zeppelin library to the new installed_contracts directory in the root of Truffle project.
