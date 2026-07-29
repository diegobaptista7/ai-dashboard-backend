const { execSync } = require('child_process');
try {
    const output = execSync('npx vercel ls --yes', { encoding: 'utf8' });
    console.log(output);
} catch (error) {
    console.error(error.stdout || error.message);
}
