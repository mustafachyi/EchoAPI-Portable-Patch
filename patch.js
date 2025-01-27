const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths relative to this script
const APP_DIR = path.join(__dirname, 'resources', 'app');
const MAIN_JS = path.join(APP_DIR, 'main.js');
const DATA_DIR = path.join(APP_DIR, 'data');

// Performance optimization switches to add
const PERFORMANCE_SWITCHES = `
// Performance optimizations
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer,HighPriorityLoading');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-http-cache', 'false');
`;

// Portable mode configuration
const PORTABLE_CONFIG = `
// Set up portable mode - store all data in the app directory
const isPortable = true; // Can be controlled by a config file later
if (isPortable) {
  const portableDir = path.join(__dirname, 'data');
  // Set all possible app paths to be portable
  app.setPath('userData', portableDir);
  app.setPath('logs', path.join(portableDir, 'logs'));
  app.setPath('crashDumps', path.join(portableDir, 'crashes'));
  app.setPath('temp', path.join(portableDir, 'temp'));
  app.setPath('cache', path.join(portableDir, 'cache'));
  
  // Ensure all directories exist
  [
    portableDir,
    path.join(portableDir, 'logs'),
    path.join(portableDir, 'crashes'),
    path.join(portableDir, 'temp'),
    path.join(portableDir, 'cache')
  ].forEach(dir => {
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
  });

  // Disable automatic updates since we're in portable mode
  app.disableHardwareAcceleration(); // Prevent GPU issues in portable mode
  if (app.setLoginItemSettings) {
    app.setLoginItemSettings({ openAtLogin: false }); // Prevent auto-start
  }
}
`;

// Enhanced window settings to add
const WINDOW_SETTINGS = `
    backgroundThrottling: false,
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    v8CacheOptions: "code",
    javascript: true,
    enableBlinkFeatures: 'HighPriorityLoading'
`;

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions with defaults
function ask(question, defaultYes = true) {
  return new Promise((resolve) => {
    const prompt = defaultYes ? ' (Y/n): ' : ' (y/N): ';
    rl.question(question + prompt, (answer) => {
      answer = answer.toLowerCase().trim();
      if (answer === '') {
        resolve(defaultYes);
      } else {
        resolve(answer === 'y');
      }
    });
  });
}

// Helper function for colored console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Check if the app is already patched
function isPatched() {
  try {
    const content = fs.readFileSync(MAIN_JS, 'utf8');
    return content.includes('const isPortable = true;');
  } catch (error) {
    return false;
  }
}

// Check if we have a backup
function hasBackup() {
  return fs.existsSync(MAIN_JS + '.backup');
}

// Check if data directory exists and has content
function hasExistingData() {
  return fs.existsSync(DATA_DIR) && fs.readdirSync(DATA_DIR).length > 0;
}

// Helper function to safely insert code after a specific line
function insertAfter(content, searchString, codeToInsert) {
  const pos = content.indexOf(searchString);
  if (pos === -1) return content;
  
  const endOfLine = content.indexOf('\n', pos);
  if (endOfLine === -1) return content;
  
  return content.slice(0, endOfLine + 1) + codeToInsert + content.slice(endOfLine + 1);
}

async function applyPatch() {
  print('[*] Checking application state...', 'cyan');

  // Verify we're in the right directory
  if (!fs.existsSync(APP_DIR)) {
    print('[ERROR] This script must be placed in the root directory of EchoAPI!', 'red');
    print('        Please place this script next to the "resources" folder and try again.', 'yellow');
    return;
  }

  // Check if already patched
  if (isPatched()) {
    print('[INFO] The application is already patched!', 'yellow');
    const answer = await ask('Would you like to revert to the original version', true);
    if (answer) {
      await revertPatch();
    }
    return;
  }

  // Create data directory structure if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    print('[+] Creating data directory structure...', 'cyan');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'logs'), { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'crashes'), { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'temp'), { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'cache'), { recursive: true });
  }

  // Backup original main.js
  const backupPath = MAIN_JS + '.backup';
  if (!hasBackup()) {
    print('[+] Creating backup of main.js...', 'cyan');
    fs.copyFileSync(MAIN_JS, backupPath);
  }

  // Modify main.js
  print('[+] Applying portable mode patch...', 'cyan');
  let mainContent = fs.readFileSync(MAIN_JS, 'utf8');

  // Insert performance switches after the path require
  mainContent = insertAfter(mainContent, 'const path = require("node:path");', PERFORMANCE_SWITCHES);

  // Insert portable configuration before userDataDir definition
  mainContent = insertAfter(mainContent, 'const path = require("node:path");', PORTABLE_CONFIG);

  // Enhance window settings
  const webPreferencesPos = mainContent.indexOf('webPreferences: {');
  if (webPreferencesPos !== -1) {
    const webPreferencesEndPos = mainContent.indexOf('\n    }', webPreferencesPos);
    if (webPreferencesEndPos !== -1) {
      mainContent = mainContent.slice(0, webPreferencesEndPos) + WINDOW_SETTINGS + mainContent.slice(webPreferencesEndPos);
    }
  }

  // Write modified content back
  fs.writeFileSync(MAIN_JS, mainContent);

  print('[SUCCESS] Patch applied successfully!', 'green');
  print('[INFO] Data directory: ' + DATA_DIR, 'bright');
  print('[INFO] Run script again to revert changes\n', 'bright');
}

async function revertPatch() {
  if (!hasBackup()) {
    print('[ERROR] No backup file found to revert to!', 'red');
    return;
  }

  if (hasExistingData()) {
    print('[WARNING] You have data in: ' + DATA_DIR, 'yellow');
    const answer = await ask('Keep this data', true);
    if (!answer) {
      print('[+] Removing data directory...', 'cyan');
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
    }
  }

  print('[+] Restoring original version...', 'cyan');
  fs.copyFileSync(MAIN_JS + '.backup', MAIN_JS);
  fs.unlinkSync(MAIN_JS + '.backup');

  print('[SUCCESS] Successfully reverted to original version!', 'green');
}

// Show welcome message
print('\n=== EchoAPI Portable Patcher ===', 'bright');
print('Makes EchoAPI portable or reverts changes.\n', 'cyan');

// Run the patch
(async () => {
  try {
    await applyPatch();
  } catch (error) {
    print('\n[ERROR] An error occurred:', 'red');
    print(error.message, 'red');
  } finally {
    rl.close();
  }
})(); 
