const Marketplace = artifacts.require("./Marketplace.sol");

/**
 * @author Sooyoung Hyun
 * @ Test for Marketplace.sol
 * Declaration of variables that will be useful to test the functions and attributes values.
 * In each of the test, the function or attribute is called and it's verified that the value is the expected one.
 */
contract("Marketplace", accounts => {

    const owner = accounts[0]
    const user = accounts[1]
    const storeOwner = accounts[2]
    let err = null

    beforeEach('setup contract for each test', async function () {
        marketplaceInstance = await Marketplace.deployed();
    });

    /**
     * Test that send a request to admin for getting authority. 
     * Owner can make user get authority. authority is needed when add a product.
     */
    it("should send a request to admin for Auth", async() => {

        await marketplaceInstance.requestAuth({from: storeOwner})
        await marketplaceInstance.setAuth(storeOwner, {from: owner})

        const storeOwnerAuth = await marketplaceInstance.getAuth(storeOwner)
        const ownerAuth = await marketplaceInstance.getAuth(owner)

        assert.equal(storeOwnerAuth, 2, 'the auth of storeOwner should be set 2(StoreOwner)')
        assert.equal(ownerAuth, 3, 'the auth of owner should be set 3(Admin)')
    })

    /**
     * Test that add a new product and compare the values of the struct with the expected ones.
     * User's authority is store owner now because of upper test. so user can add a product.
     */
    it("should store the value productName, productDesc, productImg, 5, 10", async () => {

        // Set value of product
        await marketplaceInstance.addProductToStore('productName', 'productDesc', 'productImg', '5', 
        10, { from: storeOwner });

        // Get stored value
        const storedData = await marketplaceInstance.getProduct(1);

        assert.equal(storedData[1], 'productName', "The value 'productName' was not stored.");
        assert.equal(storedData[2], 'productDesc', "The value 'productDesc' was not stored.");
        assert.equal(storedData[3], 'productImg', "The value 'productImg' was not stored.");
        assert.equal(storedData[4], '5', "The value '5' was not stored.");
        assert.equal(storedData[5], '10', "The value 10 was not stored.");
        assert.equal(storedData[6], storeOwner, `The value '${storeOwner}' was not stored.`);

    });

    /**
     * Test that buy products and compare the value of the result with the expected ones.
     */
    it("should allow someone to buy products", async() => {

        const contractBalanceBefore = await web3.eth.getBalance(marketplaceInstance.address)

        // Assume you buy 10 products. each price of product is 5 ether.
        await marketplaceInstance.buy(1, 10, {from: user, value: web3.utils.toWei('50', 'ether')})

        const contractBalanceAfter = await web3.eth.getBalance(marketplaceInstance.address)
        const result = await marketplaceInstance.getOrder(1)

        assert.equal(result[4], user, 'the buyer address should be set user address when he purchases an item')
        assert.equal(contractBalanceAfter, Number(contractBalanceBefore) + parseInt(web3.utils.toWei('50', 'ether'), 10), "contract's balance should be increased by the price of the item")
    })

    /**
     * Test that withdraw ether and compare the balance of the store owner, Before and After withdraw.
     */
    it("should allow product seller to withdraw ether", async() => {

        const ownerBalanceBefore = await marketplaceInstance.balanceOf({from: storeOwner})

        await marketplaceInstance.withdraw({from: storeOwner})

        const ownerBalanceAfter = await marketplaceInstance.balanceOf({from: storeOwner})

        assert.equal(parseInt(web3.utils.fromWei(ownerBalanceBefore, 'ether'), 10), 50, 'the deposit of storeOwner in contract should be set 50 before withdraw')
        assert.equal(ownerBalanceAfter, 0, 'the deposit of storeOwner in contract should be set 0 after withdraw')
    })

    /**
     * Test only the owner can activate the emergency stop and it works disabling 'buy' function and 'withdraw' function.
     */
    it("Testing Emergency Stop", async () => {

        try {
            await marketplaceInstance.toggleContractActive({ from: user });
        } catch (error) {
            err = error;
        }
        assert.ok(err instanceof Error);

        await marketplaceInstance.toggleContractActive({ from: owner });

        try {
            await marketplaceInstance.buy(1, 10, {from: user, value: web3.utils.toWei('50', 'ether')});
        } catch (error) {
            err = error;
        }
        assert.ok(err instanceof Error);
    });
  
});

