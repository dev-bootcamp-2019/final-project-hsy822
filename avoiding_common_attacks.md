---
Title:  Marketplace system on ethereum
Author: Sooyoung Hyun
Date:   January 2019
Mail:   hyunsy822@gmail.com
File:   Avoiding Common Attacks
---

Avoiding Common Attacks
===

## Index
- [Reentrancy](#reentrancy)
- [Integer Overflow and Underflow](#integer-overflow-and-underflow)
- [Msg.sender vs tx.origin](#msgsender-txorigin)

## Reentrancy

As we can see from the DAO case, it is a very difficult and important issue. This contract has a withdrawal function, which can be an attack point. 

To solve the problem, use the send() or transfer() function instead of the low level function call(). Transfer() is recommended rather than send() because the transaction will fail with an exception if the transfer fails.

And to prevent reentrant attacks, applied the following modifier and set the user's balance to 0 before tranfer ether.

```
modifier nonReentrancy() {  
	require(!reentrancyLock, "reentrancyLocked!");
	reentrancyLock = true;
	_;
	reentrancyLock = false;
}

function withdraw() public nonReentrancy {
	require(
		balance[msg.sender] > 0,
		"Check the balance"
	);
	uint amount = balance[msg.sender];

	// The user's balance is already 0, so future invocations won't withdraw anything
	balance[msg.sender] = 0;
	msg.sender.transfer(amount);
	emit withdrawEther(amount);
}
```

## Integer Overflow and Underflow

In the code below, the amount of tokens held in a contract is less than the amount you want to withdraw, but you can still withdraw.

```
function withdraw(uint _amount) {
    require(balances[msg.sender] - _amount > 0);
    msg.sender.transfer(_amount);
    balances[msg.sender] -= _amount;
}
```
To solve this problem, it is most common to use the SafeMath library created by openzeppelin.

### Msg.sender vs tx.origin

Never use tx.origin to check for authorisation of ownership, instead use msg.sender
