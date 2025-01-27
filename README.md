# EchoAPI Portable Patcher

Simple patch script to make EchoAPI truly portable by storing all data in the app directory. Just needs Node.js.

## Features
- Makes EchoAPI fully portable
- Stores all data in app directory
- Performance optimizations
- Easy to apply/revert
- No external dependencies

## Requirements
- Node.js installed
- EchoAPI

## Usage

### Apply Patch
1. Download `patch.js`
2. Place it in EchoAPI's root directory (next to `EchoAPI.exe`)
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
- Creates automatic backup before patching
- Safe to revert anytime
- Preserves user data if desired
