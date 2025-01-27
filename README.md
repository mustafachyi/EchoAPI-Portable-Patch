# EchoAPI Portable Patcher

Simple patch script to make EchoAPI Desktop (Electron) truly portable by storing all data in the app directory.

## Features
- Makes EchoAPI Desktop fully portable
- Stores all data in app directory
- Performance optimizations
- Easy to apply/revert
- No external dependencies

## Requirements
- Node.js installed
- EchoAPI Desktop (Electron version)
- Windows OS (Linux/Mac support untested)

## Usage

### Apply Patch
1. Download `patch.js`
2. Place it in EchoAPI Desktop's root directory (next to `EchoAPI.exe`)
3. Open terminal in that directory
4. Run:
```bash
node patch.js
```

### Revert Changes
1. Run the script again
2. Press Enter when prompted (defaults to Yes)
3. Choose whether to keep or remove the data directory

## Data Location
After patching, all app data will be stored in:
```
/path/to/EchoAPI/resources/app/data/
```

## Notes
- Only tested on Windows
- Works with the Desktop (Electron) version of EchoAPI
- Creates automatic backup before patching
- Safe to revert anytime
- Preserves user data if desired
