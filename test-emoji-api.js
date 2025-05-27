// Simple test script for emoji reaction API
const testEmojiAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing Emoji Reaction API...');
    
    // Test 1: Try to get reactions for a non-existent post (should return empty)
    console.log('\n1. Testing GET reactions for non-existent post...');
    const getResponse = await fetch(`${baseUrl}/api/emoji-reactions?postId=test-post-id`);
    const getData = await getResponse.json();
    console.log('✅ GET Response:', getData);
    
    // Test 2: Try to add a reaction without authentication (should fail)
    console.log('\n2. Testing POST reaction without auth...');
    const postResponse = await fetch(`${baseUrl}/api/emoji-reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emoji: '👍',
        amount: 0.001,
        postId: 'test-post-id'
      }),
    });
    const postData = await postResponse.json();
    console.log('❌ Expected error:', postData);
    
    console.log('\n✅ Basic API tests completed!');
    console.log('📝 Note: Full functionality requires valid user authentication and existing posts/replies.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testEmojiAPI();
}

module.exports = { testEmojiAPI }; 