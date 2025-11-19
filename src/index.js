#!/usr/bin/env node
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const args = process.argv.slice(2).filter(arg => !arg.startsWith('-'));

async function getCurrentRemote() {
    try {
        const { stdout } = await exec('git remote get-url origin');
        return stdout.trim();
    } catch (error) {
        return null;
    }
}

(async function () {
    let remoteUrl = args.find(arg => arg.startsWith('http') || arg.startsWith('git@') || arg.startsWith('ssh://') || arg.indexOf('/') > 0);

    // 2. Fallback: If no URL pattern found, just take the FIRST argument (args[0]).
    if (!remoteUrl && args.length > 0) {
        remoteUrl = args[0];
    }

    // 3. Deep Fallback: If no args provided, try to get from existing .git config
    if (!remoteUrl) {
        console.log('No URL argument provided. Checking existing git config...');
        remoteUrl = await getCurrentRemote();
    }

    // 4. Validation: If all fail, throw error.
    if (!remoteUrl) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: Could not determine remote URL from arguments or existing config.');
        process.exit(1);
    }

    console.log(`Using Remote: ${remoteUrl}`);

    try {
        const command = `rm -rf .git && git init . && git add -A && git commit --no-verify -am "woohoo" && git branch -M main && git remote add origin "${remoteUrl}" && git push --all -f`;
        
        const {stdout, stderr} = await exec(command);
        console.log(stdout);
        if (stderr) console.error(stderr);
        
    } catch (error) {
        console.error('Execution failed:', error.message);
        process.exit(1);
    }
})()