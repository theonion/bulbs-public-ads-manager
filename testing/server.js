const { exec } = require('child_process');
const express = require('express');
const hostify = require('hostify').operations;
const chalk = require('chalk');
const path = require('path');

const app = express();

const chalkOpts = {
  gPrompt: chalk.green,
  iPrompt: chalk.gray,
  yPrompt: chalk.yellow.bold,
  rPrompt: chalk.red,
};

const HOST = process.argv[2] || 'www.example.com';
const PORT = process.env.PORT || 3001;


exec(`echo 'rdr pass inet proto tcp from any to any port 80 -> 127.0.0.1 port ${PORT}' | sudo pfctl -ef -`, (error, stdout, stderr) => {
  //
});



const modifyHost = host => {
  const findHostOpts = {
    filterHostFn: val => {
      if (val.indexOf(host) !== -1) return true;
      return false;
    },
  };
  const createHost = {
    entries: [{
      ip: '127.0.0.1',
      host,
    }, ],
  };

  const hList = hostify.list(findHostOpts);
  if (hList.length) {
    console.log(chalkOpts.gPrompt('-> Existing Host Entry:'), chalkOpts.iPrompt(`${HOST}...`));
    return;
  };

  console.log(chalkOpts.gPrompt('-> Creating Host Entry:'), chalkOpts.iPrompt(`${HOST}...`));
  hostify.add(createHost);
};

const deleteHost = (host) => {
  console.log(chalkOpts.rPrompt('-> Removing Host Entry: '), chalkOpts.iPrompt(`${HOST}...`));
  const deleteHost = {
    filterHostFn: (val) => {
      if (val.indexOf(host) !== -1) return true;
      return false;
    },
  };
  hostify.delete(deleteHost);
};

modifyHost(HOST);

app.get('/prebid-test', (req, res) => {
  res.sendFile(`${__dirname}/static/prebid-test.html`);
})
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/static/index.html`);
});

app.use(express.static('static'));
app.use(express.static('dist'));
app.use(express.static(path.join(__dirname, 'bulbs-public-ads-manager', 'src')));

app.listen(PORT, console.log(chalkOpts.yPrompt(' ----> SERVER UP: '), chalkOpts.iPrompt(`${HOST}`)));

process.on('SIGINT', () => {
  exec("sudo pfctl -F all -f /etc/pf.conf", (err, stdout, stderr) => {
    deleteHost(HOST);
    process.exit();
  });
});