const { exec } = require('child_process');

exec('mount', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log('Mounts:');
    console.log(stdout);
});

exec('ls -la /', (error, stdout, stderr) => {
    if (stdout) {
        console.log('\nRoot directory:');
        console.log(stdout);
    }
});

exec('ls -la /mnt', (error, stdout, stderr) => {
    if (stdout) {
        console.log('\n/mnt directory:');
        console.log(stdout);
    }
});
