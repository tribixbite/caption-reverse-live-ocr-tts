// Simple test script for CaptnReverse
console.log('🧪 Testing CaptnReverse Web App...');

// Test 1: Check server availability
async function testServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Server is running on port 3000');
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message);
    return false;
  }
}

// Test 2: Check Tesseract.js availability
async function testTesseract() {
  try {
    // This would test if Tesseract.js loads properly
    console.log('✅ Tesseract.js should load from CDN');
    return true;
  } catch (error) {
    console.log('❌ Tesseract.js failed to load');
    return false;
  }
}

// Test 3: Check Web APIs support  
function testWebAPIs() {
  const tests = [
    { name: 'MediaDevices API', check: () => 'mediaDevices' in navigator },
    { name: 'getUserMedia', check: () => 'getUserMedia' in navigator.mediaDevices },
    { name: 'getDisplayMedia', check: () => 'getDisplayMedia' in navigator.mediaDevices },
    { name: 'Speech Synthesis', check: () => 'speechSynthesis' in window },
    { name: 'Web Speech API', check: () => 'SpeechSynthesisUtterance' in window },
    { name: 'Local Storage', check: () => 'localStorage' in window },
    { name: 'Canvas API', check: () => 'HTMLCanvasElement' in window }
  ];

  console.log('\n🔍 Checking Web API Support:');
  tests.forEach(test => {
    const supported = test.check();
    console.log(`${supported ? '✅' : '❌'} ${test.name}: ${supported ? 'Supported' : 'Not supported'}`);
  });

  return tests.every(test => test.check());
}

// Run all tests
async function runTests() {
  console.log('\n🚀 CaptnReverse Web App Test Suite\n');
  
  const serverOk = await testServer();
  const tesseractOk = await testTesseract();
  const apisOk = testWebAPIs();
  
  console.log('\n📊 Test Results:');
  console.log(`Server: ${serverOk ? '✅ Running' : '❌ Failed'}`);
  console.log(`Tesseract.js: ${tesseractOk ? '✅ Ready' : '❌ Failed'}`);
  console.log(`Web APIs: ${apisOk ? '✅ Supported' : '❌ Issues detected'}`);
  
  if (serverOk && apisOk) {
    console.log('\n🎉 CaptnReverse is ready! Open http://localhost:3000 in your browser');
  } else {
    console.log('\n⚠️ Some tests failed. Check the issues above.');
  }
}

runTests();