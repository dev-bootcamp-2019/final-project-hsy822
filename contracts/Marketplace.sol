pragma solidity ^0.5.0;

/**
  * Import SafeMath and Ownable Library from Zeppelin
  */
import "installed_contracts/zeppelin/contracts/math/SafeMath.sol";
import "installed_contracts/zeppelin/contracts/ownership/Ownable.sol";

/** 
  * @title Market place on Ethereum
  * @author Sooyoung Hyun
  * @notice You can use this contract to create online market place based on smart contracts.
  * @dev For more implementation details read the "design_pattern_decisions.md" document. 
  */
contract Marketplace is Ownable {

    mapping (address => Auth) auth;
    mapping (uint => address) requests;
    mapping (address => mapping(uint => Product)) stores;
    mapping (address => mapping(uint => Order)) orders;
    mapping (uint => address) whoseProduct;
    mapping (uint => address) whoseOrder;
    mapping (address => uint) balance;

    uint public productIndex;
    uint public orderIndex;
    uint public requestIndex;
    bool private reentrancyLock = false;
    bool public stopped = false;

    enum Auth { User, Requested, StoreOwner, Admin }

    event buyProduct (uint _productId, uint _amount, uint _totalPrice);
    event withdrawEther (uint amount);

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

    struct Product {
        uint pid;
        string name;
        string desc;
        string imageLink;
        uint price;
        uint amount;
        address seller;
    }

    struct Order {
        uint oid;
        uint pid;
        uint amount;
        uint totalPrice;
        address buyer;
    }

    using SafeMath for uint;

    constructor() public {
        productIndex = 0;
        orderIndex = 0;
        auth[msg.sender] = Auth.Admin;
    }
    /**
      * @notice Ask for get authority.
      * @dev The smart contract work as an online market place. 
      * You can't add a product if your authority is not store owner.
      */
    function requestAuth() 
        public 
    {
        auth[msg.sender] = Auth.Requested;
        requestIndex += 1;
        requests[requestIndex] = msg.sender;
    }

    /**
      * @notice Update user authority.
      * @dev Only owner can use this function to change user authority. 
      * @param _user User address for update infomation.
      */
    function setAuth(address _user) 
        public 
        onlyOwner
    {
        auth[_user] = Auth.StoreOwner;
    }

    /**
      * @notice Get user authority.
      * @dev Function used in frontend to check the user authority.
      * @param _user User address for providing infomation.  
      * @return Uint Number of elements of the enum Auth.
      */
    function getAuth(address _user) 
        public 
        view 
        returns (Auth) 
    {
        return auth[_user];
    }

    /**
      * @notice Get user request.
      * @dev Function used in frontend to check the user authority.
      * @param _requestIdx request index for providing infomation.  
      * @return Address user address of requests.
      */
    function getRequest(uint _requestIdx) 
        public 
        view 
        returns (address) 
    {
        return requests[_requestIdx];
    }

    /**
      * @dev Add product to store.
      * @param _name Name of product.
      * @param _desc Description of product.  
      * @param _imageLink It will be IPFS hash value.  
      * @param _price Price of product.
      * @param _amount Amount of product.  
      */
    function addProductToStore(
        string memory _name, 
        string memory _desc, 
        string memory _imageLink, 
        uint _price, 
        uint _amount
    )   public
        isStoreOwner
    {
        productIndex += 1;
        Product memory product = Product(productIndex, _name, _desc, _imageLink, _price, _amount, msg.sender);
        
        stores[msg.sender][productIndex] = product;
        whoseProduct[productIndex] = msg.sender;
    }

    /**
      * @notice Get product infomation.
      * @dev Function used in frontend to display the products.
      * @param _productId Product id for providing infomation.  
      * @return uint Product ID.
      * @return string Name of product.
      * @return string Description of product.
      * @return string IPFS hash.
      * @return uint Price of product.
      * @return uint Amount of product.
      * @return address Owner of product.
      */
    function getProduct(uint _productId) public view returns (uint, string memory, string memory, 
    string memory, uint, uint, address) {
        Product memory product = stores[whoseProduct[_productId]][_productId];
        return (product.pid, product.name, product.desc, product.imageLink, 
        product.price, product.amount, product.seller);
    }

    /**
      * @dev Buy product and make new order.
      * @param _productId Product id for buying product.  
      * @param _amount Amount of items to purchase.
      */
    function buy(uint _productId, uint _amount) public payable noEmergency {
        Product memory product = stores[whoseProduct[_productId]][_productId];
        uint _totalPrice = product.price*_amount;
        require(
            product.amount >= _amount,
            "Not enough amount of product"
        );
        require(
            msg.value >= _totalPrice,
            "Insufficient fund"
        );

        balance[product.seller] += msg.value;
        
        product.amount -= _amount;
        stores[whoseProduct[_productId]][_productId] = product;

        orderIndex += 1;

        Order memory order = Order(orderIndex, _productId, _amount, _totalPrice, msg.sender);
        orders[msg.sender][orderIndex] = order;
        whoseOrder[orderIndex] = msg.sender;
        emit buyProduct(_productId, _amount, _totalPrice);
    }

    /**
      * @notice Get order infomation.
      * @dev Function used in frontend to display the orders.
      * @param _orderId Order id for providing infomation.  
      * @return uint Order ID.
      * @return uint Product ID.
      * @return uint Amount of product.
      * @return uint Total price of order.
      * @return address Buyer of product.
      */
    function getOrder(uint _orderId) public view returns (uint, uint, uint, uint, address) {
        Order memory order = orders[whoseOrder[_orderId]][_orderId];
        return (order.oid, order.pid, order.amount, order.totalPrice, order.buyer);
    }

    /**
      * @notice Get balance of user.
      * @dev Function used in frontend to display the balance.
      * @return uint Balance of msg.sender.
      */
    function balanceOf() public view returns (uint){
        return balance[msg.sender];
    }
    
    /**
      * @dev Withdraw the deposit stored in the contract.
      */
    function withdraw() public nonReentrancy noEmergency {
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

    /**
     * @notice Enable the emergency stop.
     * @dev Owner of the smart contract activate the emergency stop. 
     * Function 'buy' and 'withdraw' can't be called. 
     */
    function toggleContractActive() public onlyOwner {
        stopped = !stopped;
    }
}
