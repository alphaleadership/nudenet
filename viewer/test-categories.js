const { getCategory, setCategory, removeCategory } = require('./categories');

async function testCategoryAssignment() {
    console.log('Starting category assignment tests...');
    
    // Test 1: Get category for new account (should assign default category)
    console.log('\nTest 1: New account category assignment');
    const account1 = 'test_account_1';
    const category1 = await getCategory(account1);
    console.log(`Account ${account1} got category: ${category1}`);
    
    // Test 2: Get category for another new account (should get next category)
    console.log('\nTest 2: Another new account category assignment');
    const account2 = 'test_account_2';
    const category2 = await getCategory(account2);
    console.log(`Account ${account2} got category: ${category2}`);
    
    // Test 3: Set specific category for an account
    console.log('\nTest 3: Setting specific category');
    const account3 = 'test_account_3';
    const specificCategory = '5';
    await setCategory(account3, specificCategory);
    const category3 = await getCategory(account3);
    console.log(`Account ${account3} got category: ${category3}`);
    
    // Test 4: Remove category and verify it's gone
    console.log('\nTest 4: Removing category');
    await removeCategory(account3);
    const category3AfterRemove = await getCategory(account3);
    console.log(`Account ${account3} has category: ${category3AfterRemove}`);
    
    // Test 5: Verify categories are unique
    console.log('\nTest 5: Verifying unique categories');
    const account4 = 'test_account_4';
    const category4 = await getCategory(account4);
    console.log(`Account ${account4} got category: ${category4}`);
    
    console.log('\nTest complete! Check categories.json for results.');
}

// Run the tests
testCategoryAssignment().catch(console.error);
